import { useRef, useState, memo } from 'react';
import ResultModal from './ResultModal';
import { countCorrectChars, countRawChars, TypingSample, WordCharMap } from '@/app/utils/stats';
import { useSessionTimer } from '@/app/hooks/useSessionTimer';
import { useTypingStats } from '@/app/hooks/useTypingStats';

const sampleText = `The quick brown fox jumps over the lazy dog.`;
const textList = sampleText.split(' ');

const MAX_EXTRA_CHARS = 5;

interface WordProps {
  word: string;
  charStates: WordCharMap;
  isActive: boolean;
  maxExtraChars: number;
}

const Word: React.FC<WordProps> = memo(
  ({ word, charStates, isActive, maxExtraChars }) => {
    const renderLength = Math.max(
      word.length + (isActive ? maxExtraChars : 0),
      Object.keys(charStates).length
    );

    return (
      <span className="mr-2 font-mono">
        {Array.from({ length: renderLength }).map((_, i) => {
          const state = charStates[i];
          const expected = word[i];

          if (i < word.length) {
            if (!state)
              return (
                <span key={i} className="text-gray-400">
                  {expected}
                </span>
              );

            return (
              <span
                key={i}
                className={state.correct ? 'text-green-600' : 'text-red-600'}
              >
                {expected}
              </span>
            );
          }

          if (state)
            return (
              <span key={i} className="text-red-600">
                {state.typedChar}
              </span>
            );

          return null;
        })}
      </span>
    );
  }
);

const TypingBox = ({ text = textList }: { text?: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedMap, setTypedMap] = useState<WordCharMap[]>(
    Array.from({ length: text.length }, () => ({}))
  );
  const [showResult, setShowResult] = useState(false);
  const [samples, setSamples] = useState<TypingSample[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const session = useSessionTimer();
  const stats = useTypingStats(
    typedMap,
    session.elapsedMs,
    currentWordIndex,
    samples
  );

  const currentWord = text[currentWordIndex];
  const isLastWord = currentWordIndex === text.length - 1;

  const finishSession = () => {
    session.finish();
    setShowResult(true);
  };

  const moveToNextWord = () => {
    if (isLastWord) {
      finishSession();
      return;
    }

    setCurrentWordIndex((i) => i + 1);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (session.state === 'paused') return;

    let value = e.target.value;

    if (session.state === 'idle' && value.trim() !== '') {
      session.start();
    }

    if (value.endsWith(' ') && value.trim() !== '') {
      moveToNextWord();
      return;
    }

    const maxLen = currentWord.length + MAX_EXTRA_CHARS;
    if (value.length > maxLen) {
      value = value.slice(0, maxLen);
      e.target.value = value;
    }

    const map: WordCharMap = {};
    [...value].forEach((char, i) => {
      map[i] = {
        correct: char === currentWord[i],
        typedChar: char,
      };
    });

    setTypedMap((prev) => {
      const next = [...prev];
      next[currentWordIndex] = map;
      return next;
    });

    setSamples((prev) => [
      ...prev,
      {
        timestamp: performance.now(),
        correctChars: countCorrectChars(
          typedMap,
          false,
          currentWordIndex
        ),
        rawChars: countRawChars(typedMap),
      },
    ]);


    // Finish if last word typed fully without space
    if (isLastWord && value === currentWord) {
      finishSession();
    }
  };

  const handleRestart = () => {
    session.reset();
    setCurrentWordIndex(0);
    setTypedMap(Array.from({ length: text.length }, () => ({})));
    setShowResult(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <div className="p-4 max-w-2xl">
        <div className="mb-2 text-sm space-x-4">
          <span>Live WPM: {stats.rollingWPM}</span>
          <span>WPM: {stats.correctedWPM}</span>
          <span>Raw: {stats.rawWPM}</span>
        </div>


        <div className="text-lg leading-relaxed">
          {text.map((word, i) => (
            <Word
              key={i}
              word={word}
              charStates={typedMap[i]}
              isActive={i === currentWordIndex}
              maxExtraChars={MAX_EXTRA_CHARS}
            />
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          onChange={handleInput}
          className="mt-4 p-2 border w-full"
          autoFocus
        />
      </div>

      <ResultModal
        isOpen={showResult}
        wpm={stats.finalizedWPM}
        timeMs={session.elapsedMs}
        correctChars={stats.correctChars}
        onRestart={handleRestart}
      />

    </>
  );
};

export default TypingBox;
