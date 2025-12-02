'use client';
import React, { useState } from 'react';
import TypingBox from './components/TypingBox';
import Options from './components/Options';
// import Footer from "./Footer";

const Body = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center justify-center">
      <div className="mb-8">
        <Options />
      </div>
      <TypingBox />
      {/* <Footer /> */}
      <div className="mt-8 text-sm text-gray-500">
        <p>esc or ctrl + shift + p - command line</p>
      </div>
    </div>
  );
};

export default Body;
