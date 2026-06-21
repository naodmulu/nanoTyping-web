// stats.ts

/* ---------------- WPM math ---------------- */

// Words-per-minute using the standard 5-characters-per-word convention.
export function calculateWPM(chars: number, elapsedMs: number) {
    if (elapsedMs <= 0) return 0;
    return Math.floor((chars / 5) / (elapsedMs / 60000));
}
