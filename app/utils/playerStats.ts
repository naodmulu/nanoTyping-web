import { GameMode } from './types';

export const PLAYER_NAME_KEY = 'nanoTyping-player-name';
export const PLAYER_SCORES_KEY = 'nanoTyping-player-scores';

export type PlayerScoreRecord = {
    id: string;
    playerName: string;
    mode: GameMode;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    correctChars: number;
    rawChars: number;
    errors: number;
    durationMs: number;
    wordCount?: number;
    timestamp: number;
};

export type LeaderboardEntry = {
    playerName: string;
    gamesPlayed: number;
    bestWpm: number;
    averageWpm: number;
};

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorage<T>(key: string, fallback: T): T {
    if (!isBrowser()) return fallback;

    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeStorage<T>(key: string, value: T): void {
    if (!isBrowser()) return;

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage write failures in private or full browser storage.
    }
}

export function getCurrentPlayerName(): string {
    return readStorage<string>(PLAYER_NAME_KEY, '');
}

export function setCurrentPlayerName(playerName: string): string {
    const trimmed = playerName.trim();
    writeStorage(PLAYER_NAME_KEY, trimmed);
    return trimmed;
}

export function appendScore(score: PlayerScoreRecord): PlayerScoreRecord[] {
    const playerName = score.playerName.trim();
    if (!playerName) return getPlayerHistory();

    const safeScore: PlayerScoreRecord = {
        ...score,
        id: score.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        playerName,
        timestamp: score.timestamp || Date.now(),
    };

    setCurrentPlayerName(playerName);

    const existing = readStorage<PlayerScoreRecord[]>(PLAYER_SCORES_KEY, []);
    const next = [...existing, safeScore];
    writeStorage(PLAYER_SCORES_KEY, next);

    return next;
}

export function getPlayerHistory(playerName = getCurrentPlayerName()): PlayerScoreRecord[] {
    const history = readStorage<PlayerScoreRecord[]>(PLAYER_SCORES_KEY, []);

    if (!playerName.trim()) {
        return [...history].sort((a, b) => b.timestamp - a.timestamp);
    }

    return history
        .filter((entry) => entry.playerName.toLowerCase() === playerName.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp);
}

export function getLeaderboard(limit = 5): LeaderboardEntry[] {
    const history = readStorage<PlayerScoreRecord[]>(PLAYER_SCORES_KEY, []);
    const grouped = new Map<string, PlayerScoreRecord[]>();

    history.forEach((entry) => {
        const key = entry.playerName.toLowerCase();
        const list = grouped.get(key) ?? [];
        list.push(entry);
        grouped.set(key, list);
    });

    return Array.from(grouped.entries())
        .map(([key, entries]) => ({
            playerName: entries[0]?.playerName ?? key,
            gamesPlayed: entries.length,
            bestWpm: Math.max(...entries.map((entry) => entry.wpm)),
            averageWpm: Math.round(entries.reduce((sum, entry) => sum + entry.wpm, 0) / entries.length),
        }))
        .sort((a, b) => b.bestWpm - a.bestWpm || b.averageWpm - a.averageWpm)
        .slice(0, limit);
}
