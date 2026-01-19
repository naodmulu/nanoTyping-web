// ResultModal.tsx
import React from 'react';

interface ResultModalProps {
    isOpen: boolean;
    wpm: number;
    timeMs: number;
    correctChars: number;
    onRestart: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
    isOpen,
    wpm,
    timeMs,
    correctChars,
    onRestart,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-80 text-center">
                <h2 className="text-xl font-semibold mb-4">Session Complete</h2>

                <div className="space-y-2 text-sm">
                    <div>WPM: <strong>{wpm}</strong></div>
                    <div>Correct characters: <strong>{correctChars}</strong></div>
                    <div>Time: <strong>{(timeMs / 1000).toFixed(1)}s</strong></div>
                </div>

                <button
                    onClick={onRestart}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Restart
                </button>
            </div>
        </div>
    );
};

export default ResultModal;
