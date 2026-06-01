'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ResultModal from './ResultModal';
import { useSessionTimer } from '@/app/hooks/useSessionTimer';
import { useTypingStats } from '@/app/hooks/useTypingStats';
import { CharState, GameConfig } from '@/app/utils/types';
import { DEFAULT_CONFIG } from '@/app/utils/testModes';
import { generateText, generateWordPassage } from '@/app/utils/textGenerator';
import { RenderText } from '@/app/ui/RenderText';

const WINDOW_WORD_COUNT = 20;
const TIME_MODE_EXPANSION_WORDS = 300;
const TIME_MODE_EXPANSION_TRIGGER = 100;
const DEFAULT_VISIBLE_LINE_COUNT = 6;

type WordBoundary = {
  start: number;
  end: number;
};

type LineBoundary = {
  startWordIndex: number;
  endWordIndex: number;
};

type LineLayout = {
  lineBoundaries: LineBoundary[];
  visibleLineCount: number;
};

function buildWordBoundaries(text: string): WordBoundary[] {
  const boundaries: WordBoundary[] = [];
  const wordPattern = /\S+/g;

  let match: RegExpExecArray | null;
  while ((match = wordPattern.exec(text)) !== null) {
    boundaries.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return boundaries;
}

function getVisibleWordWindow(
  text: string,
  boundaries: WordBoundary[],
  currentIndex: number,
  wordWindowSize: number
) {
  if (text.length === 0 || boundaries.length === 0) {
    return { visibleStart: 0, visibleEnd: 0 };
  }

  const clampedIndex = Math.max(0, Math.min(currentIndex, text.length));
  let anchorWordIndex = boundaries.length - 1;
  // NOTE: If performace becomes an issue, change algorithm to binary search
  // Find the word that contains the current index or is immediately before it
  for (let index = 0; index < boundaries.length; index += 1) {
    const word = boundaries[index];

    if (clampedIndex < word.start) {
      anchorWordIndex = Math.max(0, index - 1);
      break;
    }

    if (clampedIndex < word.end) {
      anchorWordIndex = index;
      break;
    }
  }

  const halfWindow = Math.floor(wordWindowSize / 2);
  let startWordIndex = Math.max(0, anchorWordIndex - halfWindow);
  let endWordIndex = Math.min(boundaries.length, startWordIndex + wordWindowSize);

  if (endWordIndex - startWordIndex < wordWindowSize) {
    startWordIndex = Math.max(0, endWordIndex - wordWindowSize);
  }

  return {
    visibleStart: boundaries[startWordIndex].start,
    visibleEnd: boundaries[endWordIndex - 1].end,
  };
}

function findWordIndexAtPosition(boundaries: WordBoundary[], index: number): number {
  if (boundaries.length === 0) {
    return 0;
  }

  const clampedIndex = Math.max(0, index);
  let left = 0;
  let right = boundaries.length - 1;
  let anchorWordIndex = boundaries.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const word = boundaries[mid];

    if (clampedIndex < word.start) {
      anchorWordIndex = Math.max(0, mid - 1);
      right = mid - 1;
    } else if (clampedIndex >= word.end) {
      left = mid + 1;
    } else {
      anchorWordIndex = mid;
      break;
    }
  }

  return anchorWordIndex;
}

function getVisibleLineWindow(
  boundaries: WordBoundary[],
  lineBoundaries: LineBoundary[],
  currentIndex: number,
  visibleLineCount: number
) {
  if (boundaries.length === 0 || lineBoundaries.length === 0) {
    return { visibleStart: 0, visibleEnd: 0 };
  }

  const currentWordIndex = findWordIndexAtPosition(boundaries, currentIndex);
  let anchorLineIndex = lineBoundaries.length - 1;

  for (let index = 0; index < lineBoundaries.length; index += 1) {
    const line = lineBoundaries[index];

    if (currentWordIndex < line.startWordIndex) {
      anchorLineIndex = Math.max(0, index - 1);
      break;
    }

    if (currentWordIndex <= line.endWordIndex) {
      anchorLineIndex = index;
      break;
    }
  }

  const lineWindowSize = Math.max(1, visibleLineCount);
  const halfWindow = Math.floor(lineWindowSize / 2);
  let startLineIndex = Math.max(0, anchorLineIndex - halfWindow);
  let endLineIndex = Math.min(lineBoundaries.length, startLineIndex + lineWindowSize);

  if (endLineIndex - startLineIndex < lineWindowSize) {
    startLineIndex = Math.max(0, endLineIndex - lineWindowSize);
  }

  const startWordIndex = lineBoundaries[startLineIndex].startWordIndex;
  const endWordIndex = lineBoundaries[endLineIndex - 1].endWordIndex;

  return {
    visibleStart: boundaries[startWordIndex].start,
    visibleEnd: boundaries[endWordIndex].end,
  };
}

function countCompletedWords(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  const clampedIndex = Math.max(0, Math.min(index, text.length));
  const typedText = text.slice(0, clampedIndex);
  const words = typedText.split(/\s+/).filter((word) => word.length > 0);

  if (clampedIndex < text.length && text[clampedIndex] !== ' ') {
    return Math.max(0, words.length - 1);
  }

  return words.length;
}

const TypingBox = ({ config = DEFAULT_CONFIG }: { config?: GameConfig }) => {
  const [fullText, setFullText] = useState('');
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [samples, setSamples] = useState<
    Array<{ timestamp: number; correctChars: number; rawChars: number }>
  >([]);
  const [lastActivityTime, setLastActivityTime] = useState<number>(performance.now());
  const [lineLayout, setLineLayout] = useState<LineLayout>({
    lineBoundaries: [],
    visibleLineCount: DEFAULT_VISIBLE_LINE_COUNT,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const measurementTextRef = useRef<HTMLSpanElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { state, elapsedMs, start, pause, resume, reset, finish } = useSessionTimer();
  const stats = useTypingStats(charStates, elapsedMs, samples);
  const wordBoundaries = useMemo(() => buildWordBoundaries(fullText), [fullText]);
  const { visibleStart, visibleEnd } = useMemo(
    () => {
      if (lineLayout.lineBoundaries.length === 0) {
        return getVisibleWordWindow(fullText, wordBoundaries, currentIndex, WINDOW_WORD_COUNT);
      }

      return getVisibleLineWindow(
        wordBoundaries,
        lineLayout.lineBoundaries,
        currentIndex,
        lineLayout.visibleLineCount
      );
    },
    [currentIndex, fullText, lineLayout.lineBoundaries, lineLayout.visibleLineCount, wordBoundaries]
  );

  const initializeText = useCallback(() => {
    setFullText(generateText(config));
    setCharStates([]);
    setCurrentIndex(0);
    setShowResult(false);
    setSamples([]);
    setLastActivityTime(performance.now());
    reset();
  }, [config, reset]);

  // Initialize text when config changes
  useEffect(() => {
    initializeText();
  }, [initializeText]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textNode = measurementTextRef.current?.firstChild;

    if (!container || !(textNode instanceof Text) || wordBoundaries.length === 0) {
      setLineLayout({
        lineBoundaries: [],
        visibleLineCount: DEFAULT_VISIBLE_LINE_COUNT,
      });
      return;
    }

    const measureLayout = () => {
      const computedStyle = window.getComputedStyle(container);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight);
      const paddingTop = Number.parseFloat(computedStyle.paddingTop);
      const paddingBottom = Number.parseFloat(computedStyle.paddingBottom);
      const contentHeight = container.clientHeight - paddingTop - paddingBottom;
      const nextVisibleLineCount =
        Number.isFinite(lineHeight) && lineHeight > 0
          ? Math.max(1, Math.floor(contentHeight / lineHeight))
          : DEFAULT_VISIBLE_LINE_COUNT;

      const nextLineBoundaries: LineBoundary[] = [];
      let currentTop: number | null = null;

      wordBoundaries.forEach((boundary, wordIndex) => {
        const range = document.createRange();
        range.setStart(textNode, boundary.start);
        range.setEnd(textNode, boundary.end);

        const rect = range.getBoundingClientRect();
        range.detach?.();

        if (rect.width === 0 && rect.height === 0) {
          return;
        }

        if (currentTop === null || Math.abs(rect.top - currentTop) > 1) {
          nextLineBoundaries.push({
            startWordIndex: wordIndex,
            endWordIndex: wordIndex,
          });
          currentTop = rect.top;
        } else {
          nextLineBoundaries[nextLineBoundaries.length - 1].endWordIndex = wordIndex;
        }
      });

      setLineLayout({
        lineBoundaries: nextLineBoundaries,
        visibleLineCount: nextVisibleLineCount,
      });
    };

    measureLayout();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureLayout();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [fullText, wordBoundaries]);

  // Scroll to current character
  useEffect(() => {
    if (currentCharRef.current && containerRef.current) {
      currentCharRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [currentIndex]);

  // Auto-pause on inactivity (15 seconds)
  useEffect(() => {
    if (state !== 'running') {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    inactivityTimerRef.current = setInterval(() => {
      const now = performance.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity >= 15000 && state === 'running') {
        pause();
      }
    }, 1000);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [state, lastActivityTime, pause]);

  // Auto-finish for time mode
  useEffect(() => {
    if (
      config.mode === 'time' &&
      state === 'running' &&
      elapsedMs >= (config.timeLimit ?? 30) * 1000
    ) {
      finish();
      setShowResult(true);
    }
  }, [elapsedMs, state, config.mode, config.timeLimit, finish]);

  const handleRestart = useCallback(() => {
    initializeText();
  }, [initializeText]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        e.preventDefault();
      }

      setLastActivityTime(performance.now());

      if (e.key === 'Escape') {
        if (state === 'running') {
          pause();
        } else if (state === 'paused') {
          resume();
          setLastActivityTime(performance.now());
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handleRestart();
        return;
      }

      if (state === 'paused') return;

      if (state === 'idle' && e.key.length === 1) {
        start();
      }

      if (e.key === 'Backspace') {
        if (currentIndex > 0) {
          const nextIndex = currentIndex - 1;
          setCurrentIndex(nextIndex);
          setCharStates((prev) => prev.slice(0, -1));
        }
        return;
      }

      if (e.key.length === 1) {
        const expectedChar = fullText[currentIndex];
        const typedChar = e.key;
        const isCorrect = typedChar === expectedChar;
        const nextIndex = currentIndex + 1;

        const newState: CharState = {
          correct: isCorrect,
          typedChar,
          position: currentIndex,
        };

        setCharStates((prev) => [...prev, newState]);
        setCurrentIndex(nextIndex);

        setSamples((prev) => [
          ...prev,
          {
            timestamp: performance.now(),
            correctChars: charStates.filter((c) => c.correct).length + (isCorrect ? 1 : 0),
            rawChars: charStates.length + 1,
          },
        ]);

        if (config.mode === 'time') {
          if (nextIndex > fullText.length - TIME_MODE_EXPANSION_TRIGGER) {
            setFullText((prev) => prev + ' ' + generateWordPassage(TIME_MODE_EXPANSION_WORDS));
          }
          return;
        }

        if (config.mode === 'words') {
          const completedWords = countCompletedWords(fullText, nextIndex);
          if (completedWords >= (config.wordCount ?? 0) || nextIndex >= fullText.length) {
            finish();
            setShowResult(true);
          }
        }
      }
    },
    [
      charStates,
      config.mode,
      config.timeLimit,
      config.wordCount,
      currentIndex,
      finish,
      fullText,
      handleRestart,
      pause,
      resume,
      start,
      state,
    ]
  );

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <div className="p-4 max-w-4xl w-full">
        <div className="mb-6 text-sm space-x-6 text-gray-400 flex flex-wrap justify-center">
          <span className="flex items-center gap-2">
            <span className="text-gray-500">wpm</span>
            <span className="text-2xl font-semibold text-white">{stats.correctedWPM}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-gray-500">raw</span>
            <span className="text-xl text-gray-300">{stats.rawWPM}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-gray-500">acc</span>
            <span
              className={`text-xl font-semibold ${stats.accuracy >= 95
                ? 'text-green-400'
                : stats.accuracy >= 80
                  ? 'text-yellow-400'
                  : 'text-red-400'
                }`}
            >
              {stats.accuracy}%
            </span>
          </span>
          {config.mode === 'words' && (
            <span className="flex items-center gap-2">
              <span className="text-gray-500">words</span>
              <span className="text-xl text-white">
                {Math.min(countCompletedWords(fullText, currentIndex), config.wordCount ?? 0)}/
                {config.wordCount}
              </span>
            </span>
          )}

          {config.mode === 'time' && (
            <span className="flex items-center gap-2">
              <span className="text-gray-500">time</span>
              <span className="text-xl text-white">
                {Math.max(0, (config.timeLimit ?? 30) - Math.floor(elapsedMs / 1000))}s
              </span>
            </span>
          )}
        </div>

        <div
          ref={containerRef}
          className="text-2xl leading-relaxed font-mono p-8 bg-gray-800/50 rounded-lg border border-gray-700/50 min-h-[200px] max-h-[300px] overflow-y-auto focus:outline-none select-none relative no-scrollbar"
          tabIndex={0}
          style={{ wordBreak: 'break-word' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 invisible p-8 text-2xl leading-relaxed font-mono whitespace-pre-wrap break-words"
          >
            <span ref={measurementTextRef}>{fullText}</span>
          </div>
          <RenderText
            fullText={fullText}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            charStates={charStates}
            currentIndex={currentIndex}
            currentCharRef={currentCharRef}
          />
          {state === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg z-10">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">PAUSED</div>
                <div className="text-sm text-gray-400">Press Esc to resume</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>tab to restart • esc to pause/resume</p>
        </div>
      </div>

      <ResultModal
        isOpen={showResult}
        wpm={stats.finalizedWPM}
        rawWpm={stats.rawWPM}
        timeMs={elapsedMs}
        correctChars={stats.correctChars}
        rawChars={stats.rawChars}
        errors={stats.errors}
        accuracy={stats.accuracy}
        wordCount={config.mode === 'words' ? config.wordCount : undefined}
        onRestart={handleRestart}
      />
    </>
  );
};

export default TypingBox;
