'use client';
import React, { useState } from 'react';
import { GameMode, GameConfig } from '@/app/utils/types';
import { TIME_OPTIONS, WORD_COUNT_OPTIONS } from '@/app/utils/testModes';
import ButtonWithMenu from './ButtonWithMenu';

interface OptionsProps {
    config: GameConfig;
    onConfigChange: (config: GameConfig) => void;
}

const Options: React.FC<OptionsProps> = ({ config, onConfigChange }) => {
    const handleModeChange = (mode: GameMode) => {
        onConfigChange({ ...config, mode });
    };

    const handleWordCountChange = (count: number) => {
        onConfigChange({ ...config, wordCount: count });
    };

    const handleTimeChange = (time: number) => {
        onConfigChange({ ...config, timeLimit: time });
    };

    return (
        <div className="flex gap-6 items-center text-gray-400 text-sm">
            <button
                className={`hover:text-yellow-400 transition-colors ${config.punctuation ? 'text-yellow-400' : ''
                    }`}
                onClick={() =>
                    onConfigChange({ ...config, punctuation: !config.punctuation })
                }
                disabled
                title="Coming soon"
            >
                punctuation
            </button>

            <button
                className={`hover:text-yellow-400 transition-colors ${config.numbers ? 'text-yellow-400' : ''
                    }`}
                onClick={() =>
                    onConfigChange({ ...config, numbers: !config.numbers })
                }
                disabled
                title="Coming soon"
            >
                numbers
            </button>

            <ButtonWithMenu
                config={config}
                mode="words"
                label="words"
                value={config.wordCount}
                handleModeChange={handleModeChange}
                handleChange={handleWordCountChange}
                options={WORD_COUNT_OPTIONS}
            />

            <ButtonWithMenu
                config={config}
                mode="time"
                label="time"
                value={config.timeLimit}
                handleModeChange={handleModeChange}
                handleChange={handleTimeChange}
                options={TIME_OPTIONS}
            />

            <button
                className={`hover:text-yellow-400 transition-colors ${config.mode === 'quote' ? 'text-yellow-400' : ''
                    }`}
                onClick={() => handleModeChange('quote')}
                disabled
                title="Coming soon"
            >
                quote
            </button>
        </div>
    );
};

export default Options;