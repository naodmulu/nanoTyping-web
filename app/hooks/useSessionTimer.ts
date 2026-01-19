// useSessionTimer.ts
import { useCallback, useRef, useState } from 'react';

type SessionState = 'idle' | 'running' | 'paused';

export function useSessionTimer() {
    const [state, setState] = useState<SessionState>('idle');
    const [elapsedMs, setElapsedMs] = useState(0);

    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const tick = useCallback((time: number) => {
        if (startTimeRef.current == null) return;

        setElapsedMs((prev) => prev + (time - startTimeRef.current!));
        startTimeRef.current = time;
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const start = useCallback(() => {
        if (state !== 'idle') return;

        setState('running');
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [state, tick]);

    const pause = useCallback(() => {
        if (state !== 'running') return;

        setState('paused');
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        startTimeRef.current = null;
    }, [state]);

    const resume = useCallback(() => {
        if (state !== 'paused') return;

        setState('running');
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [state, tick]);

    const reset = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        startTimeRef.current = null;

        setElapsedMs(0);
        setState('idle');
    }, []);

    // useSessionTimer.ts (add this)
    const finish = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        startTimeRef.current = null;
        setState('paused');
    }, []);


    return {
        state,
        elapsedMs,
        start,
        pause,
        resume,
        reset,
        finish
    };
}
