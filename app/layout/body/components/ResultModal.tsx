'use client';
import React from 'react';

interface ResultModalProps {
    isOpen: boolean;
    wpm: number;
    rawWpm: number;
    timeMs: number;
    correctChars: number;
    rawChars: number;
    errors: number;
    accuracy: number;
    wordCount?: number;
    onRestart: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
    isOpen,
    wpm,
    rawWpm,
    timeMs,
    correctChars,
    rawChars,
    errors,
    accuracy,
    wordCount,
    onRestart,
}) => {
    if (!isOpen) return null;

    const timeSeconds = (timeMs / 1000).toFixed(1);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-semibold mb-6 text-center text-white">Test Complete</h2>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">WPM</span>
                        <span className="text-3xl font-bold text-white">{wpm}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Raw WPM</span>
                        <span className="text-xl text-gray-300">{rawWpm}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Accuracy</span>
                        <span className={`text-xl font-semibold ${
                            accuracy >= 95 ? 'text-green-500' : 
                            accuracy >= 80 ? 'text-yellow-500' : 
                            'text-red-500'
                        }`}>
                            {accuracy}%
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Characters</span>
                        <span className="text-gray-300">{correctChars}/{rawChars}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Errors</span>
                        <span className="text-red-400">{errors}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Time</span>
                        <span className="text-gray-300">{timeSeconds}s</span>
                    </div>

                    {wordCount && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Words</span>
                            <span className="text-gray-300">{wordCount}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onRestart}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-3 rounded transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;
