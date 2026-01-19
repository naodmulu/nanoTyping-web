'use client';
import React, { useState, useEffect, useRef } from 'react';
import { TestMode, TestConfig } from '@/app/utils/types';
import { WORD_COUNT_OPTIONS } from '@/app/utils/testModes';

interface OptionsProps {
    config: TestConfig;
    onConfigChange: (config: TestConfig) => void;
}

const Options: React.FC<OptionsProps> = ({ config, onConfigChange }) => {
    const [showWordCountMenu, setShowWordCountMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowWordCountMenu(false);
            }
        };

        if (showWordCountMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showWordCountMenu]);

    const handleModeChange = (mode: TestMode) => {
        if (mode === 'time' || mode === 'quote' || mode === 'custom') {
            // Disabled for now
            return;
        }
        onConfigChange({ ...config, mode });
    };

    const handleWordCountChange = (count: number) => {
        onConfigChange({ ...config, wordCount: count });
        setShowWordCountMenu(false);
    };

    return (
        <div className="flex gap-6 items-center text-gray-400 text-sm">
            <button
                className={`hover:text-yellow-400 transition-colors ${config.punctuation ? 'text-yellow-400' : ''}`}
                onClick={() => onConfigChange({ ...config, punctuation: !config.punctuation })}
                disabled
                title="Coming soon"
            >
                punctuation
            </button>
            <button
                className={`hover:text-yellow-400 transition-colors ${config.numbers ? 'text-yellow-400' : ''}`}
                onClick={() => onConfigChange({ ...config, numbers: !config.numbers })}
                disabled
                title="Coming soon"
            >
                numbers
            </button>
            <button
                className={`hover:text-yellow-400 transition-colors ${config.mode === 'time' ? 'text-yellow-400' : ''}`}
                onClick={() => handleModeChange('time')}
                disabled
                title="Coming soon"
            >
                time
            </button>
            <div className="relative" ref={menuRef}>
                <button
                    className={`hover:text-yellow-400 transition-colors ${config.mode === 'words' ? 'text-yellow-400' : ''}`}
                    onClick={() => {
                        handleModeChange('words');
                        setShowWordCountMenu(!showWordCountMenu);
                    }}
                >
                    words {config.wordCount && `(${config.wordCount})`}
                </button>
                {showWordCountMenu && config.mode === 'words' && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 min-w-[80px]">
                        {WORD_COUNT_OPTIONS.map((count) => (
                            <button
                                key={count}
                                className={`block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                                    config.wordCount === count ? 'text-yellow-400 bg-gray-700' : 'text-gray-300'
                                }`}
                                onClick={() => handleWordCountChange(count)}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button
                className={`hover:text-yellow-400 transition-colors ${config.mode === 'quote' ? 'text-yellow-400' : ''}`}
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
