import { useState } from 'react';

const sampleText = `The quick brown fox jumps over the lazy dog. Typing is a fundamental skill that can be improved with practice. Consistent practice leads to better speed and accuracy.`;
const textList = sampleText.split(' ');

const TypingBox = ({ text = textList }: { text?: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedIndices, setTypedIndices] = useState<number[][]>(
    Array(text.length).fill([]) // each word gets an empty array initially
  );

  const currentWord = text[currentWordIndex];

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setTypedIndices((prev) => {
      const newTyped = [...prev]; // shallow copy outer array
      newTyped[currentWordIndex] = value.split('').map((_, i) => i); // update only current word
      return newTyped;
    });

    // Move to next word if finished
    if (value === text[currentWordIndex]) {
      setCurrentWordIndex((prev) => prev + 1);
      e.target.value = ''; // reset input for next word
    }
  };

  const handleRest = () => {
    setCurrentWordIndex(0);
    setTypedIndices([]);
  };

  return (
    <div className=" text-black p-4 rounded mb-4 w-full max-w-2xl ">
      <div className="whitespace-normal break-words">
        {text.map((word, wordIndex) => (
          <span key={wordIndex} className="mr-2">
            {[...word].map((char, charIndex) => {
              const isTyped = typedIndices[wordIndex]?.includes(charIndex); // check word-specific array
              return (
                <span
                  key={charIndex}
                  style={{ color: isTyped ? 'green' : 'gray' }}>
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
