'use client';
import React, { useMemo, useState } from 'react';
import TypingBox from './components/TypingBox';
import Options from './components/Options';
import { GameConfig } from '@/app/utils/types';
import { DEFAULT_CONFIG } from '@/app/utils/testModes';
import { getCurrentPlayerName, getLeaderboard, getPlayerHistory, setCurrentPlayerName } from '@/app/utils/playerStats';

const Body = () => {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [playerName, setPlayerName] = useState(getCurrentPlayerName());
  const [refreshTick, setRefreshTick] = useState(0);

  const leaderboard = useMemo(() => getLeaderboard(5), [refreshTick]);
  const history = useMemo(() => getPlayerHistory(playerName), [playerName, refreshTick]);

  const savePlayer = () => {
    const nextName = setCurrentPlayerName(playerName);
    setPlayerName(nextName);
    setRefreshTick((prev) => prev + 1);
  };

  const recentScores = history.slice(0, 5);
  const bestScore = recentScores[0];

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-6xl grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-gray-700 bg-gray-900/80 p-4 text-white shadow-lg">
          <h2 className="text-xl font-semibold">Player account</h2>
          <p className="mt-1 text-sm text-gray-400">Create a name, play, and your scores will be stored in this browser.</p>

          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Enter your name"
            className="mt-4 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none ring-0"
          />
          <button
            type="button"
            onClick={savePlayer}
            className="mt-3 w-full rounded bg-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-yellow-400"
          >
            Save account
          </button>

          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Best score</div>
              <div className="mt-1 text-2xl font-semibold">{bestScore?.wpm ?? 0} WPM</div>
              <div className="text-sm text-gray-300">{bestScore?.accuracy ?? 0}% accuracy</div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Recent games</div>
              <div className="mt-2 space-y-1 text-sm text-gray-200">
                {recentScores.length === 0 ? (
                  <p className="text-gray-400">No scores saved yet.</p>
                ) : (
                  recentScores.map((score) => (
                    <div key={score.id} className="flex items-center justify-between gap-2">
                      <span>{score.wpm} WPM</span>
                      <span className="text-gray-400">{new Date(score.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Leaderboard</div>
              <div className="mt-2 space-y-1 text-sm text-gray-200">
                {leaderboard.length === 0 ? (
                  <p className="text-gray-400">Play a round to appear here.</p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div key={entry.playerName} className="flex items-center justify-between gap-2">
                      <span>#{index + 1} {entry.playerName}</span>
                      <span className="text-gray-400">{entry.bestWpm} WPM</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-8">
            <Options config={config} onConfigChange={setConfig} />
          </div>
          <TypingBox
            config={config}
            playerName={playerName}
            onScoreSaved={() => setRefreshTick((prev) => prev + 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default Body;
