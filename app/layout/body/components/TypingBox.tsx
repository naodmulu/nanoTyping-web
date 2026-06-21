'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ResultModal from './ResultModal';
import { useSessionTimer } from '@/app/hooks/useSessionTimer';
import { useTypingStats } from '@/app/hooks/useTypingStats';
import { CharState, GameConfig } from '@/app/utils/types';
import { DEFAULT_CONFIG } from '@/app/utils/testModes';
import { generateText, generateWordPassage } from '@/app/utils/textGenerator';
import { RenderText } from '@/app/ui/RenderText';
import {
  buildWordBoundaries,
  countCompletedWords,
  getVisibleLineWindow,
  getVisibleWordWindow,
  LineLayout,
  LineBoundary,
} from '@/app/utils/textWindow';
import {
  EMPTY_COUNTS,
  TypingCounts,
  applyBackspace,
  applyKeystroke,
} from '@/app/utils/typingCounters';

const WINDOW_WORD_COUNT = 20;
const TIME_MODE_EXPANSION_WORDS = 300;
const TIME_MODE_EXPANSION_TRIGGER = 100;
const DEFAULT_VISIBLE_LINE_COUNT = 6;

const TypingBox = ({ config = DEFAULT_CONFIG }: { config?: GameConfig }) => {
  const [fullText, setFullText] = useState('');
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  // Running character tallies, updated incrementally (O(1) per key) instead of
  // re-scanning charStates. charStates is retained purely for rendering.
  const [counts, setCounts] = useState<TypingCounts>(EMPTY_COUNTS);
  const [lastActivityTime, setLastActivityTime] = useState<number>(0);
  const [lineLayout, setLineLayout] = useState<LineLayout>({
    lineBoundaries: [],
    visibleLineCount: DEFAULT_VISIBLE_LINE_COUNT,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const measurementTextRef = useRef<HTMLSpanElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { state, elapsedMs, start, pause, resume, reset, finish } = useSessionTimer();
  const stats = useTypingStats(counts, elapsedMs);
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
    setCounts(EMPTY_COUNTS);
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

  // Scroll to current character (instant jump when user prefers reduced motion)
  useEffect(() => {
    if (currentCharRef.current && containerRef.current) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      currentCharRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
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
          const removed = charStates[charStates.length - 1];
          setCurrentIndex(nextIndex);
          setCharStates((prev) => prev.slice(0, -1));
          setCounts((prev) => applyBackspace(prev, removed?.correct ?? false));
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

        const nextCounts = applyKeystroke(counts, isCorrect);

        setCharStates((prev) => [...prev, newState]);
        setCurrentIndex(nextIndex);
        setCounts(nextCounts);

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
      counts,
      config.mode,
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
          className="typing-focus-target text-2xl leading-relaxed font-mono p-8 bg-gray-800/50 rounded-lg border border-gray-700/50 min-h-[200px] max-h-[300px] overflow-y-auto select-none relative no-scrollbar"
          tabIndex={0}
          role="textbox"
          aria-label="Typing test. Focus here and type the highlighted characters."
          aria-multiline="true"
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
