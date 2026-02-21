import CharDisplay from '@/app/ui/CharDisplay';
import { CharState } from '@/app/utils/types';
import type { ReactNode, RefObject } from 'react';

interface RenderTextArgs {
    text: string;
    charStates: CharState[]
    currentIndex: number;
    currentCharRef: RefObject<HTMLSpanElement>;
}


export const RenderText = ({
    text,
    charStates,
    currentIndex,
    currentCharRef,
}: RenderTextArgs): ReactNode => {
    let globalCharIndex = 0;
    const words = text.split(' ');

    return words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block" >
            {/* Letters */}
            {
                word.split('').map((char, letterIndex) => {
                    const state = charStates[globalCharIndex] ?? null;
                    const isCurrent = globalCharIndex === currentIndex;
                    const id = `${wordIndex}-${letterIndex}`;

                    const el = (
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

                    globalCharIndex++;
                    return el;
                })}

            {/* Space */}
            {
                wordIndex < words.length - 1 && (() => {
                    const state = charStates[globalCharIndex] ?? null;
                    const isCurrent = globalCharIndex === currentIndex;
                    const id = `${wordIndex}-space`;

                    const spaceEl = (
                        <span
                            key={id}
                            id={id}
                            ref={isCurrent ? currentCharRef : null}
                            className="inline-block"
                        >
                            <CharDisplay
                                char={'\u00A0'}
                                state={state}
                                isCurrent={isCurrent}
                            />
                        </span>
                    );

                    globalCharIndex++;
                    return spaceEl;
                })()
            }
        </span>
    ));
};
