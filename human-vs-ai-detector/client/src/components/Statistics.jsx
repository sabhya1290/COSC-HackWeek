import React, { useEffect, useState } from 'react';
import { getStats } from '../utils/api';
import { ArrowLeft, BarChart2, PieChart, Star, Compass, Play, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from './AudioSynth';

export default function Statistics({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError('Could not load statistics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
          <BarChart2 className="text-indigo-500" size={32} />
          Statistics Dashboard
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-8 text-center text-red-500">
          <p>{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 glow-purple">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Games Played</span>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Play size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.gamesPlayed}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Overall challenge count</p>
          </div>

          <div className="glass-card rounded-2xl p-6 glow-cyan">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Avg Accuracy</span>
              <div className="p-2 bg-cyan-100 dark:bg-cyan-950/50 rounded-xl text-cyan-600 dark:text-cyan-400">
                <PieChart size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.averageAccuracy}%
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.averageAccuracy}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 glow-emerald">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Favorite Category</span>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Compass size={20} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">
              {stats.favoriteCategory}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Most tested format</p>
          </div>

          <div className="glass-card rounded-2xl p-6 glow-rose">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Correct Guesses</span>
              <div className="p-2 bg-rose-100 dark:bg-rose-950/50 rounded-xl text-rose-600 dark:text-rose-400">
                <Star size={20} />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.correctAnswers}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Out of {stats.totalAnswers} total guesses
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
