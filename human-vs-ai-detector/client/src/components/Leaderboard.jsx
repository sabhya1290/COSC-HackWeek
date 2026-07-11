import React, { useEffect, useState } from 'react';
import { getLeaderboard, addLeaderboardEntry } from '../utils/api';
import { Trophy, Search, Clock, Award, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from './AudioSynth';

export default function Leaderboard({ onBack, currentDifficulty }) {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch (err) {
      setError('Could not load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredEntries = entries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto p-4 md:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <button
          onClick={() => { playSound.click(); onBack(); }}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mr-auto"
        >
          <ArrowLeft size={20} /> Back to Main Menu
        </button>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="text-amber-500 fill-amber-500" size={32} />
          Hall of Fame
        </h1>
      </div>

      <div className="glass-card rounded-2xl p-6 glow-purple">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search agent name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <button
            onClick={() => { playSound.click(); fetchEntries(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && <div className="text-center py-4 text-red-500">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No entries found. Play a game and log your score!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                  <th className="py-3 px-4 text-center">Max Streak</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredEntries.map((entry, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    'text-amber-500 font-bold',
                    'text-slate-400 font-bold',
                    'text-amber-700 font-bold'
                  ];

                  return (
                    <tr
                      key={entry.id}
                      className="text-slate-700 dark:text-slate-300 hover:bg-white/5 dark:hover:bg-slate-800/25 transition duration-150"
                    >
                      <td className="py-4 px-4 font-semibold">
                        {isTop3 ? (
                          <span className={`flex items-center gap-1 ${rankColors[index]}`}>
                            <Award size={18} /> #{index + 1}
                          </span>
                        ) : (
                          `#${index + 1}`
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                        {entry.name}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                          ${entry.difficulty.toLowerCase() === 'easy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : ''}
                          ${entry.difficulty.toLowerCase() === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' : ''}
                          ${entry.difficulty.toLowerCase() === 'hard' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300' : ''}
                          ${entry.difficulty.toLowerCase() === 'impossible' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' : ''}
                        `}>
                          {entry.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        {entry.accuracy}%
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                        <span className="flex items-center justify-center gap-1">
                          <Zap size={14} className="fill-indigo-500 text-indigo-500" />
                          {entry.bestStreak}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {entry.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
