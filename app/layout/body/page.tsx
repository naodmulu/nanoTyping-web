"use client";
import React, { useState } from "react";
import TypingBox from "./components/TypingBox";
import Options from "./components/Options";
// import Footer from "./Footer";

const Body = () => {
  const [text] = useState(
    "mean develop take group last eye with mean make use much high eye need just only see long here world at house we most it the find eye year face because what have nation year plan increase some".split(
      " "
    )
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center justify-center">
      <div className="mb-8">
        <Options />
      </div>
      <TypingBox
        text={text}
        currentWordIndex={currentWordIndex}
        setCurrentWordIndex={setCurrentWordIndex}
      />
      {/* <Footer /> */}
      <div className="mt-8 text-sm text-gray-500">
        <p>esc or ctrl + shift + p - command line</p>
      </div>
    </div>
  );
};

export default Body;
