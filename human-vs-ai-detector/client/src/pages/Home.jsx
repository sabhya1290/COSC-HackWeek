import React from 'react';
import { playSound } from '../components/AudioSynth';
import {
  Trophy,
  BarChart2,
  Calendar,
  Users,
  Settings,
  Image,
  FileText,
  Code,
  Palette,
  Mic,
  Shuffle,
  Volume2,
  VolumeX,
  Zap,
  Info,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home({
  difficulty,
  setDifficulty,
  category,
  setCategory,
  onStartGame,
  onViewLeaderboard,
  onViewStats,
  onViewDailyChallenge,
  onViewMultiplayer,
  onViewAdmin,
  soundOn,
  setSoundOn,
  narrationOn,
  setNarrationOn
}) {
  const difficulties = [
    { value: 'easy', label: '🟢 Easy', desc: 'Obvious clues' },
    { value: 'medium', label: '🔵 Medium', desc: 'Standard content' },
    { value: 'hard', label: '🟡 Hard', desc: 'Advanced neural models' },
    { value: 'impossible', label: '🔴 Impossible', desc: 'Slightest anomalies' }
  ];

  const categories = [
    { value: 'image', label: 'Images', icon: Image, color: 'text-sky-500 bg-sky-500/10' },
    { value: 'text', label: 'Text', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
    { value: 'code', label: 'Code', icon: Code, color: 'text-emerald-500 bg-emerald-500/10' },
    { value: 'artwork', label: 'Artwork', icon: Palette, color: 'text-purple-500 bg-purple-500/10' },
    { value: 'voice', label: 'Voice Clips', icon: Mic, color: 'text-rose-500 bg-rose-500/10' },
    { value: 'mixed', label: 'Mixed Mode', icon: Shuffle, color: 'text-indigo-500 bg-indigo-500/10' }
  ];

  const handleDifficultySelect = (val) => {
    playSound.click();
    setDifficulty(val);
  };

  const handleCategorySelect = (val) => {
    playSound.click();
    setCategory(val);
  };

  const badges = [
    { name: 'Streak Master', desc: 'Get 5 correct answers in a row', icon: '🔥' },
    { name: 'Cyborg Sensor', desc: 'Complete hard mode with >80% accuracy', icon: '🤖' },
    { name: 'Code Guru', desc: 'Correctly identify 5 code snippets', icon: '💻' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-500/25">
          <Sparkles size={14} className="animate-pulse" /> Cyber Intelligence Training
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
          HUMAN <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">VS AI</span>
          <br />
          DETECTOR
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Can you distinguish the spark of human creativity from the cold calculations of artificial neural networks?
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Play Setup Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Categories Selector */}
          <div className="glass-card rounded-3xl p-6 glow-purple">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap size={20} className="text-indigo-500 fill-indigo-500" />
              1. Choose Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`p-4 rounded-2xl border transition flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group
                      ${isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-indigo-500 dark:hover:border-indigo-400'
                      }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20' : cat.color} transition group-hover:scale-110`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="glass-card rounded-3xl p-6 glow-cyan">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings size={20} className="text-cyan-500" />
              2. Select Difficulty
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {difficulties.map((diff) => {
                const isSelected = difficulty === diff.value;
                return (
                  <button
                    key={diff.value}
                    onClick={() => handleDifficultySelect(diff.value)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between
                      ${isSelected
                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                        : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-cyan-500 dark:hover:border-cyan-400'
                      }`}
                  >
                    <span className="text-sm font-bold">{diff.label}</span>
                    <span className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {diff.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => { playSound.click(); onStartGame(); }}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            🚀 Launch Investigation (Start Game)
          </button>
        </div>

        {/* Game Modes & Settings Sidebar */}
        <div className="space-y-6">
          {/* Game Modes Panel */}
          <div className="glass-card rounded-3xl p-6 glow-rose">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              🏆 Game Modes
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => { playSound.click(); onViewDailyChallenge(); }}
                className="w-full py-3 px-4 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-3 transition"
              >
                <Calendar className="text-indigo-500" size={18} />
                <span>Daily Challenge</span>
              </button>
              <button
                onClick={() => { playSound.click(); onViewMultiplayer(); }}
                className="w-full py-3 px-4 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-3 transition"
              >
                <Users className="text-rose-500" size={18} />
                <span>Local Duel (VS)</span>
              </button>
              <button
                onClick={() => { playSound.click(); onViewLeaderboard(); }}
                className="w-full py-3 px-4 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-3 transition"
              >
                <Trophy className="text-amber-500" size={18} />
                <span>Leaderboard</span>
              </button>
              <button
                onClick={() => { playSound.click(); onViewStats(); }}
                className="w-full py-3 px-4 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-3 transition"
              >
                <BarChart2 className="text-emerald-500" size={18} />
                <span>Statistics</span>
              </button>
            </div>
          </div>

          {/* Sound Settings Card */}
          <div className="glass-card rounded-3xl p-6 glow-emerald">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              ⚙️ Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Sound Effects</span>
                <button
                  onClick={() => { playSound.click(); setSoundOn(!soundOn); }}
                  className={`p-2 rounded-xl transition ${soundOn ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                >
                  {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Voice Narration</span>
                <button
                  onClick={() => { playSound.click(); setNarrationOn(!narrationOn); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${narrationOn ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  {narrationOn ? 'Active' : 'Muted'}
                </button>
              </div>
            </div>
          </div>

          {/* Achievements Sneak-peek */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              🛡️ Achievements
            </h3>
            <div className="space-y-3">
              {badges.map((b, idx) => (
                <div key={idx} className="flex gap-3 items-start text-left">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</h4>
                    <p className="text-[10px] text-slate-400">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin link */}
          <div className="text-center">
            <button
              onClick={() => { playSound.click(); onViewAdmin(); }}
              className="text-[11px] font-bold text-slate-400 hover:text-indigo-500 hover:underline"
            >
              🔐 Database Admin Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
