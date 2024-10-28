import React from "react";

const Options = () => {
  return (
    <div className="flex gap-4 text-gray-400">
      <button className="hover:text-yellow-500">punctuation</button>
      <button className="hover:text-yellow-500">numbers</button>
      <button className="hover:text-yellow-500">time</button>
      <button className="hover:text-yellow-500 text-yellow-500">words</button>
      <button className="hover:text-yellow-500">quote</button>
    </div>
  );
};

export default Options;
