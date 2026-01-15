import { useRef, useState } from 'react';

const sampleText = `The quick brown fox jumps over the lazy dog.`;
const textList = sampleText.split(' ');

type CharState = {
  correct: boolean;
  typedChar: string;
};

type WordCharMap = Record<number, CharState>;

const MAX_EXTRA_CHARS = 5;

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
    if (inputValue.endsWith(' ')) {
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

          const renderLength = isActive
            ? word.length + MAX_EXTRA_CHARS
            : word.length;

          return (
            <span key={wordIndex} className="mr-2 relative">
              {Array.from({ length: renderLength }).map((_, charIndex) => {
                const charState = charStates[charIndex];
                const expectedChar = word[charIndex];

                // 1️⃣ Expected characters (within word length)
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
                      className={
                        charState.correct ? 'text-green-600' : 'text-red-600'
                      }>
                      {expectedChar}
                    </span>
                  );
                }

                // 2️⃣ Extra characters (beyond word length)
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
          className="bg-red-500 text-white px-4 py-2 rounded">
          Reset
        </button>
      </div>
    </div>
  );
};

export default TypingBox;
