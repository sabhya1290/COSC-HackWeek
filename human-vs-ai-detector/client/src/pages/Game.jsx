import React, { useState, useEffect, useRef } from 'react';
import { getQuestion, submitAnswer, addLeaderboardEntry, incrementGamesPlayed } from '../utils/api';
import { playSound } from '../components/AudioSynth';
import {
  Zap,
  Clock,
  Sparkles,
  Trophy,
  Share2,
  Volume2,
  VolumeX,
  ArrowRight,
  Eye,
  HelpCircle,
  BarChart,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import canvasConfetti from 'canvas-confetti';

export default function Game({
  difficulty,
  category,
  onBack,
  soundOn,
  narrationOn
}) {
  // Game state
  const [phase, setPhase] = useState('playing'); // playing, endscreen
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playedIds, setPlayedIds] = useState([]);

  // Scoring
  const [stats, setStats] = useState({
    correct: 0,
    wrong: 0,
    score: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // Turn status
  const [selectedGuess, setSelectedGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); // { correct, answer, explanation, clues, confidence }
  const [isFlipped, setIsFlipped] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  // Hint
  const [showHint, setShowHint] = useState(false);

  // Leaderboard save
  const [playerName, setPlayerName] = useState('');
  const [savedLeaderboard, setSavedLeaderboard] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Voice narration synthesizer ref
  const synthesisRef = useRef(window.speechSynthesis);

  // Cleanup synthesis on unmount
  useEffect(() => {
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const playVoiceClip = () => {
    if (!question || !synthesisRef.current) return;
    playSound.click();
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(question.content);
    
    // Simulate AI voice vs Human voice
    if (question.answer === 'AI') {
      utterance.pitch = 0.6;
      utterance.rate = 0.8;
    } else {
      utterance.pitch = 1.05;
      utterance.rate = 1.0;
    }

    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    synthesisRef.current.speak(utterance);
  };

  // Load question
  const fetchNextQuestion = async (currentExcludes) => {
    setLoading(true);
    setSubmitted(false);
    setSelectedGuess('');
    setResult(null);
    setIsFlipped(false);
    setShowHint(false);
    setTimeLeft(15);

    try {
      const data = await getQuestion(category, difficulty, currentExcludes);
      setQuestion(data);
      setPlayedIds((prev) => [...prev, data.id]);

      // Trigger Voice Narration
      if (narrationOn && synthesisRef.current) {
        synthesisRef.current.cancel();
        // Read the title and first 100 characters of description
        const textToSpeak = `Was this ${data.type} created by a human or an AI? ${data.title}.`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Give AI questions a slightly different speed/pitch to simulate bot feel if voice clips are played
        if (data.type === 'voice' && data.answer === 'AI') {
          utterance.pitch = 0.8;
          utterance.rate = 0.9;
        } else {
          utterance.pitch = 1.0;
          utterance.rate = 1.0;
        }
        synthesisRef.current.speak(utterance);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNextQuestion([]);
  }, []);

  // Timer Countdown loop
  useEffect(() => {
    if (loading || submitted || phase === 'endscreen') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, submitted, phase]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || phase === 'endscreen') return;

      const key = e.key.toLowerCase();
      // Only trigger if not typing inside player name input
      if (document.activeElement.tagName === 'INPUT') return;

      if (!submitted) {
        if (key === '1' || key === 'h') {
          playSound.click();
          setSelectedGuess('Human');
        } else if (key === '2' || key === 'a') {
          playSound.click();
          setSelectedGuess('AI');
        } else if (key === 'enter' || key === 's') {
          if (selectedGuess) handleSubmit();
        } else if (key === 'i') {
          playSound.click();
          setShowHint(true);
        }
      } else {
        if (key === ' ' || key === 'spacebar' || key === 'enter') {
          e.preventDefault();
          handleContinue();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGuess, submitted, loading, question]);

  const handleTimeout = () => {
    // Automatically submit a blank/wrong guess on timeout
    if (soundOn) playSound.wrong();
    setStats((prev) => ({
      ...prev,
      wrong: prev.wrong + 1,
      currentStreak: 0
    }));

    setResult({
      correct: false,
      answer: question.answer,
      explanation: 'Time expired! You failed to submit a guess in 15 seconds.',
      clues: question.clues || [],
      confidence: question.confidence || 50
    });
    setSubmitted(true);
    setIsFlipped(true);
  };

  const handleSubmit = async () => {
    if (!selectedGuess || submitted) return;
    clearInterval(timerRef.current);

    try {
      const data = await submitAnswer(question.id, selectedGuess);
      setResult(data);
      setSubmitted(true);
      setIsFlipped(true);

      if (data.correct) {
        if (soundOn) playSound.correct();
        
        // Calculate points based on speed and difficulty
        let basePoints = 100;
        if (difficulty === 'hard') basePoints = 150;
        if (difficulty === 'impossible') basePoints = 200;
        
        const speedBonus = Math.round(timeLeft * 5); // up to 75 extra points
        const roundScore = basePoints + speedBonus;

        setStats((prev) => {
          const nextStreak = prev.currentStreak + 1;
          return {
            ...prev,
            correct: prev.correct + 1,
            score: prev.score + roundScore,
            currentStreak: nextStreak,
            bestStreak: Math.max(prev.bestStreak, nextStreak)
          };
        });
      } else {
        if (soundOn) playSound.wrong();
        setStats((prev) => ({
          ...prev,
          wrong: prev.wrong + 1,
          currentStreak: 0
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinue = () => {
    playSound.click();
    if (round >= 10) {
      // Trigger game stats upload
      incrementGamesPlayed();
      setPhase('endscreen');
      if (soundOn) playSound.gameOver();
      
      // Confetti on high score
      if (stats.score >= 700) {
        canvasConfetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } else {
      setRound((r) => r + 1);
      fetchNextQuestion(playedIds);
    }
  };

  const handleSaveLeaderboard = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    playSound.click();
    setSaveLoading(true);

    try {
      await addLeaderboardEntry({
        name: playerName,
        score: stats.score,
        accuracy: Math.round((stats.correct / 10) * 100),
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        bestStreak: stats.bestStreak
      });
      setSavedLeaderboard(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const shareScore = () => {
    playSound.click();
    const text = `🎮 I scored ${stats.score} points with ${Math.round((stats.correct/10)*100)}% accuracy on the Human vs AI Detector Game! Can you beat my streak of ${stats.bestStreak}?`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! Share with friends.');
  };

  const playAgain = () => {
    playSound.click();
    setPhase('playing');
    setRound(1);
    setStats({
      correct: 0,
      wrong: 0,
      score: 0,
      currentStreak: 0,
      bestStreak: 0
    });
    setSavedLeaderboard(false);
    setPlayerName('');
    fetchNextQuestion([]);
  };

  // Accuracy calculation
  const totalRoundsPlayed = stats.correct + stats.wrong;
  const accuracyPercent = totalRoundsPlayed > 0 ? Math.round((stats.correct / totalRoundsPlayed) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {phase === 'playing' ? (
        <>
          {/* Header Stats */}
          <div className="grid grid-cols-5 gap-2 md:gap-4 text-center">
            <div className="glass-card rounded-xl p-2 md:p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Correct</span>
              <span className="text-sm md:text-lg font-bold text-emerald-500">{stats.correct}</span>
            </div>
            <div className="glass-card rounded-xl p-2 md:p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Wrong</span>
              <span className="text-sm md:text-lg font-bold text-rose-500">{stats.wrong}</span>
            </div>
            <div className="glass-card rounded-xl p-2 md:p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Accuracy</span>
              <span className="text-sm md:text-lg font-bold text-cyan-500 font-mono">{accuracyPercent}%</span>
            </div>
            <div className="glass-card rounded-xl p-2 md:p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Streak</span>
              <span className="text-sm md:text-lg font-bold text-amber-500 flex items-center justify-center gap-0.5">
                <Zap size={14} className="fill-amber-500 text-amber-500" /> {stats.currentStreak}
              </span>
            </div>
            <div className="glass-card rounded-xl p-2 md:p-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Score</span>
              <span className="text-sm md:text-lg font-bold text-indigo-500 font-mono">{stats.score}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Question {round} of 10</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {timeLeft}s
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(round / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Main Card Flipping Section */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            question && (
              <div className="perspective-1000 w-full min-h-[380px]">
                <div
                  className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                  {/* Front Side of the Card */}
                  <div className="backface-hidden w-full h-full glass-card rounded-3xl p-6 glow-purple flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-500/20">
                          {question.type}
                        </span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full
                          ${difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : ''}
                          ${difficulty === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : ''}
                          ${difficulty === 'hard' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' : ''}
                          ${difficulty === 'impossible' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : ''}
                        `}>
                          {difficulty}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                        {question.title}
                      </h2>

                      {/* Content Preview based on category */}
                      <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 mb-6 overflow-y-auto max-h-[300px]">
                        {question.type === 'code' ? (
                          <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {question.content}
                          </pre>
                        ) : question.type === 'image' || question.type === 'artwork' ? (
                          <img
                            src={question.content}
                            alt={question.title}
                            className="w-full h-48 md:h-56 object-cover rounded-xl shadow-inner"
                          />
                        ) : question.type === 'voice' ? (
                          <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <button
                              type="button"
                              onClick={playVoiceClip}
                              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95
                                ${isPlayingVoice 
                                  ? 'bg-rose-600 shadow-rose-600/35 text-white animate-pulse' 
                                  : 'bg-indigo-600 shadow-indigo-600/35 text-white'
                                }`}
                            >
                              <Volume2 size={36} />
                            </button>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {isPlayingVoice ? 'Playing voice clip...' : 'Listen to voice clip'}
                            </span>
                            
                            {/* Animated sound wave bars */}
                            <div className="flex gap-1.5 justify-center items-center h-8">
                              {[...Array(6)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 bg-indigo-500 rounded-full ${isPlayingVoice ? 'animate-sound-wave' : 'h-2'}`}
                                  style={{
                                    animationDelay: `${i * 0.12}s`
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                            {question.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {/* Guess Actions */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {['Human', 'AI'].map((option) => (
                            <button
                              key={option}
                              onClick={() => { playSound.click(); setSelectedGuess(option); }}
                              className={`py-3 px-4 rounded-xl border font-bold transition flex items-center justify-center gap-2
                                ${selectedGuess === option
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowHint(true)}
                            className="px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition flex items-center justify-center"
                            title="Reveal hint"
                          >
                            <HelpCircle size={20} />
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={!selectedGuess}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                          >
                            Submit Guess
                          </button>
                        </div>

                        {/* Hint panel */}
                        {showHint && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-500/25 rounded-xl text-xs"
                          >
                            💡 <strong>Hint:</strong> {question.hint}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Back Side of the Card (Result/Explanations) */}
                  <div className="backface-hidden w-full h-full glass-card rounded-3xl p-6 glow-cyan flex flex-col justify-between rotate-y-180 absolute top-0 left-0">
                    {result && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {result.correct ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-bold text-xs uppercase border border-emerald-500/20">
                                <CheckCircle size={14} /> Correct
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-full font-bold text-xs uppercase border border-rose-500/20">
                                <XCircle size={14} /> Wrong
                              </span>
                            )}
                            <span className="text-xs text-slate-400">Target was {result.answer}</span>
                          </div>
                          {/* AI Confidence Meter */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Confidence</span>
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                              {result.confidence}%
                            </span>
                          </div>
                        </div>

                        {/* Confidence Progress bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Analysis</h4>
                          <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                            {result.explanation}
                          </p>
                        </div>

                        {result.clues && result.clues.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clues to look for:</h4>
                            <ul className="space-y-1.5">
                              {result.clues.map((clue, idx) => (
                                <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <span className="text-indigo-500 font-bold">•</span>
                                  <span>{clue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleContinue}
                      className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {round >= 10 ? 'Finish Investigation' : 'Next Investigation'} <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Footer controls */}
          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => { playSound.click(); onBack(); }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:underline"
            >
              Abort Game
            </button>
            <div className="flex gap-4 text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-sans font-bold">1</span> Human
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-sans font-bold">2</span> AI
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-sans font-bold">I</span> Hint
              </span>
            </div>
          </div>
        </>
      ) : (
        /* End Screen UI */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 text-center glow-purple space-y-6"
        >
          <Trophy className="mx-auto text-amber-500 fill-amber-500 animate-bounce" size={64} />
          
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Investigation Complete!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Here is your agent evaluation report</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs text-slate-400 font-bold uppercase block">Final Score</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.score}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs text-slate-400 font-bold uppercase block">Accuracy</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{accuracyPercent}%</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 col-span-2">
              <span className="text-xs text-slate-400 font-bold uppercase block">Best Streak</span>
              <span className="text-lg font-bold text-amber-500 flex items-center justify-center gap-1 mt-1">
                <Zap size={16} className="fill-amber-500 text-amber-500" /> {stats.bestStreak} correct in a row
              </span>
            </div>
          </div>

          {/* Leaderboard Log Input */}
          {!savedLeaderboard ? (
            <form onSubmit={handleSaveLeaderboard} className="max-w-sm mx-auto space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Agent Name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                  className="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={saveLoading || !playerName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition text-sm flex items-center gap-1"
                >
                  <Save size={16} /> {saveLoading ? 'Logging...' : 'Log Score'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-semibold max-w-sm mx-auto">
              ✓ Score successfully logged on the Leaderboard!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={playAgain}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Play Again
            </button>
            <button
              onClick={shareScore}
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> Share Score
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold rounded-xl transition"
            >
              Main Menu
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
