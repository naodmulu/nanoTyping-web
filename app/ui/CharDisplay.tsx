import { CharState } from '@/app/utils/types';
import React, { memo, forwardRef } from 'react';

interface CharDisplayProps {
    char: string;
    state: CharState | null;
    isCurrent: boolean;
}

const CharDisplay = memo(
    forwardRef<HTMLSpanElement, CharDisplayProps>(
        ({ char, state, isCurrent }, ref) => {
            let className = 'text-gray-500';

            if (state) {
                className = state.correct
                    ? 'text-gray-300'
                    : 'text-red-500 bg-red-500/20';
            } else if (isCurrent) {
                className =
                    'text-gray-500 underline decoration-yellow-400 decoration-2';
            }

            return (
                <span ref={isCurrent ? ref : null} className={className}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            );
        }
    )
);

CharDisplay.displayName = 'CharDisplay';

export default CharDisplay;
