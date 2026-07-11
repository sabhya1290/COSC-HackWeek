import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Game from './pages/Game';
import Leaderboard from './components/Leaderboard';
import Statistics from './components/Statistics';
import AdminPanel from './components/AdminPanel';
import MultiplayerMode from './components/MultiplayerMode';
import DailyChallenge from './components/DailyChallenge';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Moon, Sun, Monitor, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [page, setPage] = useState('home');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('mixed');
  const [soundOn, setSoundOn] = useLocalStorage('sound_on', true);
  const [narrationOn, setNarrationOn] = useLocalStorage('narration_on', false);
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  // Sync dark mode class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-slate-50 to-indigo-100 dark:from-slate-950 dark:to-indigo-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header bar */}
      <header className="sticky top-0 z-50 w-full py-4 px-6 glass-panel border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setPage('home')}
            className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
          >
            🕵️‍♂️ HUMAN OR BOT?
          </button>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content wrapper */}
      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Home
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                category={category}
                setCategory={setCategory}
                onStartGame={() => setPage('game')}
                onViewLeaderboard={() => setPage('leaderboard')}
                onViewStats={() => setPage('stats')}
                onViewDailyChallenge={() => setPage('daily')}
                onViewMultiplayer={() => setPage('multiplayer')}
                onViewAdmin={() => setPage('admin')}
                soundOn={soundOn}
                setSoundOn={setSoundOn}
                narrationOn={narrationOn}
                setNarrationOn={setNarrationOn}
              />
            </motion.div>
          )}

          {page === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Game
                difficulty={difficulty}
                category={category}
                onBack={() => setPage('home')}
                soundOn={soundOn}
                narrationOn={narrationOn}
              />
            </motion.div>
          )}

          {page === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Leaderboard onBack={() => setPage('home')} currentDifficulty={difficulty} />
            </motion.div>
          )}

          {page === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Statistics onBack={() => setPage('home')} />
            </motion.div>
          )}

          {page === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel onBack={() => setPage('home')} />
            </motion.div>
          )}

          {page === 'multiplayer' && (
            <motion.div
              key="multiplayer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MultiplayerMode onBack={() => setPage('home')} />
            </motion.div>
          )}

          {page === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DailyChallenge onBack={() => setPage('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/20 dark:border-slate-800/20 mt-12">
        <p>© 2026 Human vs AI Detector Game. Crafted with React, Express & Tailwind CSS.</p>
      </footer>
    </div>
  );
}
