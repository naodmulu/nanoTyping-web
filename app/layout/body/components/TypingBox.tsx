import { useRef, useState, memo } from 'react';

const sampleText = `The quick brown fox jumps over the lazy dog.`;
const textList = sampleText.split(' ');

type CharState = {
  correct: boolean;
  typedChar: string;
};

type WordCharMap = Record<number, CharState>;

const MAX_EXTRA_CHARS = 5;

// Memoized Word Component
interface WordProps {
  word: string;
  charStates: WordCharMap;
  isActive: boolean;
  maxExtraChars: number;
}

const Word: React.FC<WordProps> = memo(
  ({ word, charStates, isActive, maxExtraChars }) => {
    // Always render enough characters to display typed errors
    const renderLength = Math.max(
      word.length + (isActive ? maxExtraChars : 0),
      Object.keys(charStates).length
    );

    return (
      <span className="mr-2 relative">
        {Array.from({ length: renderLength }).map((_, charIndex) => {
          const charState = charStates[charIndex];
          const expectedChar = word[charIndex];

          // Expected characters
          if (charIndex < word.length) {
            if (!charState) {
              return (
                <span key={charIndex} className="text-gray-400">
                  {expectedChar}
                </span>
              );
            }

            return (
              <span
                key={charIndex}
                className={charState.correct ? 'text-green-600' : 'text-red-600'}
              >
                {expectedChar}
              </span>
            );
          }

          // Extra characters beyond word length
          if (charState) {
            return (
              <span key={charIndex} className="text-red-600">
                {charState.typedChar}
              </span>
            );
          }

          return null;
        })}
      </span>
    );
  },
  (prev, next) => {
    if (prev.word !== next.word) return false;
    if (prev.isActive !== next.isActive) return false;

    const prevKeys = Object.keys(prev.charStates);
    const nextKeys = Object.keys(next.charStates);
    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every((key) => {
      const p = prev.charStates[Number(key)];
      const n = next.charStates[Number(key)];
      return p?.correct === n?.correct && p?.typedChar === n?.typedChar;
    });
  }
);

const TypingBox = ({ text = textList }: { text?: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedMap, setTypedMap] = useState<WordCharMap[]>(
    Array.from({ length: text.length }, () => ({} as WordCharMap))
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentWord = text[currentWordIndex];

  const moveToNextWord = () => {
    setCurrentWordIndex((prev) => (prev < text.length - 1 ? prev + 1 : prev));
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // SPACE → move to next word
    if (inputValue.endsWith(' ') && inputValue.trim() !== '') {
      moveToNextWord();
      return;
    }

    // Enforce max typing length
    const maxLength = currentWord.length + MAX_EXTRA_CHARS;
    if (inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength);
      e.target.value = inputValue;
    }

    const charMap: WordCharMap = {};

    [...inputValue].forEach((typedChar, index) => {
      const expectedChar = currentWord[index];
      charMap[index] = {
        correct: typedChar === expectedChar,
        typedChar,
      };
    });

    // Update ONLY the current word
    setTypedMap((prev) => {
      const next = [...prev];
      next[currentWordIndex] = charMap;
      return next;
    });
  };

  const handleReset = () => {
    setCurrentWordIndex(0);
    setTypedMap(Array.from({ length: text.length }, () => ({} as WordCharMap)));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="text-black p-4 rounded w-full max-w-2xl">
      {/* Display */}
      <div className="whitespace-normal break-words text-lg leading-relaxed font-mono">
        {text.map((word, wordIndex) => {
          const charStates = typedMap[wordIndex] || {};
          const isActive = wordIndex === currentWordIndex;

          return (
            <Word
              key={wordIndex}
              word={word}
              charStates={charStates}
              isActive={isActive}
              maxExtraChars={MAX_EXTRA_CHARS}
            />
          );
        })}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        onChange={handleInput}
        className="mt-4 p-2 border rounded w-full"
        autoFocus
      />

      {/* Reset */}
      <div className="mt-4">
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default TypingBox;
