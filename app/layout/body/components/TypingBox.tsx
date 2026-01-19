'use client';
import { useEffect, useRef, useState, memo, useCallback } from 'react';
import ResultModal from './ResultModal';
import { useSessionTimer } from '@/app/hooks/useSessionTimer';
import { useTypingStats } from '@/app/hooks/useTypingStats';
import { CharState, TestConfig } from '@/app/utils/types';
import { DEFAULT_CONFIG, WORD_COUNT_OPTIONS } from '@/app/utils/testModes';
import { calculateWPM } from '@/app/utils/stats';

// Simple word list for testing (100 words)
const WORD_LIST = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'cat', 'mouse',
  'house', 'tree', 'car', 'book', 'computer', 'keyboard', 'screen', 'monitor', 'desk', 'chair',
  'table', 'door', 'window', 'wall', 'floor', 'ceiling', 'room', 'kitchen', 'bathroom', 'bedroom',
  'living', 'dining', 'office', 'garage', 'garden', 'yard', 'street', 'road', 'city', 'town',
  'country', 'state', 'nation', 'world', 'earth', 'planet', 'sun', 'moon', 'star', 'sky',
  'cloud', 'rain', 'snow', 'wind', 'storm', 'weather', 'season', 'spring', 'summer', 'winter',
  'autumn', 'fall', 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'time',
  'clock', 'watch', 'calendar', 'date', 'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening',
  'night', 'dawn', 'dusk', 'noon', 'midnight', 'breakfast', 'lunch', 'dinner', 'snack', 'meal',
  'food', 'water', 'coffee', 'tea', 'juice', 'milk', 'bread', 'butter', 'cheese', 'meat'
];

function generateText(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORD_LIST[i % WORD_LIST.length]);
  }
  return words.join(' ');
}

interface CharDisplayProps {
  char: string;
  state: CharState | null;
  isCurrent: boolean;
}

const CharDisplay: React.FC<CharDisplayProps> = memo(({ char, state, isCurrent }) => {
  let className = 'text-gray-500';

  if (state) {
    className = state.correct ? 'text-gray-300' : 'text-red-500 bg-red-500/20';
  } else if (isCurrent) {
    className = 'text-gray-500 underline decoration-yellow-400 decoration-2';
  }

  return (
    <span className={className}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
});

CharDisplay.displayName = 'CharDisplay';



const TypingBox = ({ config = DEFAULT_CONFIG }: { config?: TestConfig }) => {
  const [text, setText] = useState<string>('');
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [samples, setSamples] = useState<Array<{ timestamp: number; correctChars: number; rawChars: number }>>([]);
  const [lastActivityTime, setLastActivityTime] = useState<number>(performance.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const session = useSessionTimer();
  const stats = useTypingStats(charStates, session.elapsedMs, samples);

  // Initialize text when config changes
  useEffect(() => {
    const wordCount = config.wordCount || 25;
    const newText = generateText(wordCount);
    setText(newText);
    setCharStates([]);
    setCurrentIndex(0);
    setShowResult(false);
    setSamples([]);
    session.reset();
  }, [config.wordCount]);


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
    // Only set up timer when session is running
    if (session.state !== 'running') {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Check inactivity every second
    inactivityTimerRef.current = setInterval(() => {
      const now = performance.now();
      const timeSinceLastActivity = now - lastActivityTime;

      // Auto-pause after 15 seconds of inactivity
      if (timeSinceLastActivity >= 15000 && session.state === 'running') {
        session.pause();
      }
    }, 1000);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [session.state, lastActivityTime, session]);

  const finishSession = useCallback(() => {
    session.finish();
    setShowResult(true);
  }, [session]);

  const handleRestart = useCallback(() => {
    session.reset();
    const wordCount = config.wordCount || 25;
    const newText = generateText(wordCount);
    setText(newText);
    setCharStates([]);
    setCurrentIndex(0);
    setShowResult(false);
    setSamples([]);
    // Reset activity time on restart
    setLastActivityTime(performance.now());
  }, [session, config.wordCount]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default for typing keys
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      e.preventDefault();
    }

    // Update last activity time on any keystroke
    setLastActivityTime(performance.now());

    // Handle special keys
    if (e.key === 'Escape') {
      if (session.state === 'running') {
        session.pause();
      } else if (session.state === 'paused') {
        session.resume();
        // Reset activity time when resuming
        setLastActivityTime(performance.now());
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      handleRestart();
      return;
    }

    if (session.state === 'paused') return;

    // Start session on first keystroke
    if (session.state === 'idle' && e.key.length === 1) {
      session.start();
    }

    if (e.key === 'Backspace') {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        setCharStates((prev) => prev.slice(0, -1));
      }
      return;
    }

    // Handle regular character input
    if (e.key.length === 1) {
      const expectedChar = text[currentIndex];
      const typedChar = e.key;
      const isCorrect = typedChar === expectedChar;

      const newState: CharState = {
        correct: isCorrect,
        typedChar,
        position: currentIndex,
      };

      setCharStates((prev) => [...prev, newState]);
      setCurrentIndex((prev) => prev + 1);

      // Record sample for rolling WPM
      setSamples((prev) => [
        ...prev,
        {
          timestamp: performance.now(),
          correctChars: charStates.filter((c) => c.correct).length + (isCorrect ? 1 : 0),
          rawChars: charStates.length + 1,
        },
      ]);

      // Check if test is complete
      if (currentIndex + 1 >= text.length) {
        finishSession();
      } else {
        // Check word count completion for words mode
        // Count completed words (words that have been fully typed including space after, or last word if fully typed)
        if (config.mode === 'words' && config.wordCount) {
          const typedText = text.slice(0, currentIndex + 1);
          // Split by spaces to get words
          const words = typedText.split(/\s+/).filter(w => w.length > 0);

          // If current character is a space, we've completed the previous word
          // If we're at the end of text, count all words
          let completedWords = words.length;
          if (currentIndex + 1 < text.length && text[currentIndex + 1] !== ' ') {
            // We're in the middle of a word, so don't count the last incomplete word
            completedWords = Math.max(0, words.length - 1);
          }

          if (completedWords >= config.wordCount) {
            finishSession();
          }
        }
      }
    }
  }, [text, currentIndex, session, config, charStates, finishSession, handleRestart]);

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const renderText = () => {
    return text.split('').map((char, i) => {
      const state = charStates[i] || null;
      const isCurrent = i === currentIndex;

      return (
        <span
          key={i}
          ref={isCurrent ? currentCharRef : null}
          className="inline-block"
        >
          <CharDisplay char={char} state={state} isCurrent={isCurrent} />
        </span>
      );
    });
  };

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
            <span className={`text-xl font-semibold ${stats.accuracy >= 95 ? 'text-green-400' :
              stats.accuracy >= 80 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
              {stats.accuracy}%
            </span>
          </span>
          {config.mode === 'words' && (() => {
            const typedText = text.slice(0, currentIndex);
            const words = typedText.split(/\s+/).filter(w => w.length > 0);
            // Count completed words: if we're at a space or end, count all words; otherwise count - 1
            let completedWords = words.length;
            if (currentIndex < text.length && text[currentIndex] !== ' ') {
              completedWords = Math.max(0, words.length - 1);
            }
            return (
              <span className="flex items-center gap-2">
                <span className="text-gray-500">words</span>
                <span className="text-xl text-white">
                  {completedWords}/{config.wordCount}
                </span>
              </span>
            );
          })()}
        </div>

        <div
          ref={containerRef}
          className="text-2xl leading-relaxed font-mono p-8 bg-gray-800/50 rounded-lg border border-gray-700/50 min-h-[200px] focus:outline-none select-none relative"
          tabIndex={0}
          style={{ wordBreak: 'break-word' }}
        >
          {renderText()}
          {session.state === 'paused' && (
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
        timeMs={session.elapsedMs}
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
