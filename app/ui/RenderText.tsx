import CharDisplay from '@/app/ui/CharDisplay';
import { CharState } from '@/app/utils/types';
import type { ReactNode, RefObject } from 'react';

interface RenderTextArgs {
    fullText: string;
    visibleStart: number;
    visibleEnd: number;
    charStates: CharState[]
    currentIndex: number;
    currentCharRef: RefObject<HTMLSpanElement>;
}


export const RenderText = ({
    fullText,
    visibleStart,
    visibleEnd,
    charStates,
    currentIndex,
    currentCharRef,
}: RenderTextArgs): ReactNode => {
    const visibleText = fullText.slice(visibleStart, visibleEnd);

    return visibleText.split('').map((char, localIndex) => {
        const globalIndex = visibleStart + localIndex;
        const state = charStates[globalIndex] ?? null;
        const isCurrent = globalIndex === currentIndex;
        const id = `${globalIndex}`;

        return (
            <span
                key={id}
                id={id}
                ref={isCurrent ? currentCharRef : null}
                className="inline-block"
            >
                <CharDisplay
                    char={char}
                    state={state}
                    isCurrent={isCurrent}
                />
            </span>
        );
    });
};
