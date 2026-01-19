'use client';
import React, { useState } from 'react';
import TypingBox from './components/TypingBox';
import Options from './components/Options';
import { TestConfig } from '@/app/utils/types';
import { DEFAULT_CONFIG } from '@/app/utils/testModes';

const Body = () => {
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 px-4">
      <div className="mb-8">
        <Options config={config} onConfigChange={setConfig} />
      </div>
      <TypingBox config={config} />
    </div>
  );
};

export default Body;
