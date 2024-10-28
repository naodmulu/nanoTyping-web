import React, { useState } from "react";

const TypingBox = ({ text, currentWordIndex, setCurrentWordIndex }) => {
  const [input, setInput] = useState("");

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);

    if (newValue.trim() === text[currentWordIndex]) {
      setInput("");
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg w-3/4 text-lg font-mono">
      <div className="flex flex-wrap gap-2">
        {text.map((word, index) => (
          <span
            key={index}
            className={`${
              index === currentWordIndex
                ? "bg-yellow-500 text-gray-900 px-1"
                : "text-gray-400"
            }`}
          >
            {word}
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        className="mt-4 w-full bg-gray-700 text-gray-200 p-2 rounded"
        placeholder="Start typing..."
      />
    </div>
  );
};

export default TypingBox;
