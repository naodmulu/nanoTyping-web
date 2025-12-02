import { useEffect, useRef, useState } from 'react';

const sampleText = `The quick brown fox jumps over the lazy dog.`;
const textList = sampleText.split(' ');

const TypingBox = ({ text = textList }: { text?: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Each word gets its own dictionary mapping character index -> { correct: boolean }
  type CharState = { correct: boolean };
  type WordCharMap = Record<number, CharState>;

  const [typedMap, setTypedMap] = useState<WordCharMap[]>(
    // initialize one empty object per word
    Array.from({ length: text.length }, () => ({} as WordCharMap))
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentWord =
    text[currentWordIndex] + (text.length === currentWordIndex + 1 ? '' : ' ');

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const inputLength = inputValue.length;
    const charMap: WordCharMap = {};

    // Build per-character status for the current word
    [...currentWord].forEach((char, index) => {
      if (index >= inputLength) return; // skip untyped chars
      const typedChar = inputValue[index];
      charMap[index] = {
        correct: typedChar === char,
      };
    });

    // Update only the dictionary for the current word
    setTypedMap((prev) => {
      const next = prev.slice();
      next[currentWordIndex] = charMap;
      return next;
    });

    // Move to next word if fully typed correctly
    if (inputValue === currentWord) {
      setCurrentWordIndex((prev) => prev + 1);
      e.target.value = ''; // reset input for next word
    }
  };

  useEffect(() => {
    console.log('typedMap', typedMap.slice(0, currentWordIndex + 1));
  }, [typedMap]);

  const handleRest = () => {
    setCurrentWordIndex(0);
    setTypedMap(Array.from({ length: text.length }, () => ({} as WordCharMap)));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className=" text-black p-4 rounded mb-4 w-full max-w-2xl ">
      <div className="whitespace-normal break-words">
        {text.map((word, wordIndex) => (
          <span key={wordIndex}>
            {[...word].map((char, charIndex) => {
              const charState = typedMap[wordIndex]?.[charIndex];
              const isTyped = !!charState;
              const correct = charState?.correct ?? false;
              const color = correct ? 'green' : isTyped ? 'red' : 'gray';

              return (
                <span key={`${wordIndex}_${charIndex}`} style={{ color }}>
                  {char}
                </span>
              );
            })}{' '}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        onChange={handleInput}
        className="mt-4 p-2 border rounded"
        autoFocus
      />

      {/* Reset Buttons */}
      <div className="mt-4">
        <button
          onClick={handleRest}
          className="bg-red-500 text-white px-4 py-2 rounded mr-2">
          Reset
        </button>
      </div>
    </div>
  );
};

export default TypingBox;
