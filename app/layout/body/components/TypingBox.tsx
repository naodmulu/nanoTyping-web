import { useState } from 'react';

const sampleText = `The quick brown fox jumps over the lazy dog. Typing is a fundamental skill that can be improved with practice. Consistent practice leads to better speed and accuracy.`;
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

  const currentWord = text[currentWordIndex];

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Build a per-character map for the current word only
    const charMap: WordCharMap = {};
    [...value].forEach((ch, i) => {
      charMap[i] = { correct: currentWord?.[i] === ch };
    });

    // Update only the dictionary for the current word
    setTypedMap((prev) => {
      const next = prev.slice();
      next[currentWordIndex] = charMap;
      return next;
    });

    // Move to next word if finished
    if (value === currentWord) {
      setCurrentWordIndex((prev) => prev + 1);
      e.target.value = ''; // reset input for next word
    }
  };

  const handleRest = () => {
    setCurrentWordIndex(0);
    setTypedMap(Array.from({ length: text.length }, () => ({} as WordCharMap)));
  };

  return (
    <div className=" text-black p-4 rounded mb-4 w-full max-w-2xl ">
      <div className="whitespace-normal break-words">
        {text.map((word, wordIndex) => (
          <span key={wordIndex} className="mr-2">
            {[...word].map((char, charIndex) => {
              const charState = typedMap[wordIndex]?.[charIndex];
              const isTyped = !!charState;
              const correct = charState?.correct ?? false;

              const color = correct ? 'green' : isTyped ? 'red' : 'gray';

              return (
                <span key={charIndex} style={{ color }}>
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </div>

      <input
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
