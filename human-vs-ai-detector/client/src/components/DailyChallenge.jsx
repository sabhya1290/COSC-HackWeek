import React, { useState, useEffect } from 'react';
import { getQuestion } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { playSound } from './AudioSynth';
import canvasConfetti from 'canvas-confetti';

export default function DailyChallenge({ onBack }) {
  const [gameState, setGameState] = useState('loading'); // loading, ready, completed, playing, gameover
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [clues, setClues] = useState([]);

  // Generate a date string key: YYYY-MM-DD
  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = `daily_challenge_${todayKey}`;

  useEffect(() => {
    // Check if already completed today
    const done = localStorage.getItem(storageKey);
    if (done) {
      setScore(Number(done));
      setGameState('completed');
    } else {
      fetchDailyQuestions();
    }
  }, []);

  const fetchDailyQuestions = async () => {
    setGameState('loading');
    try {
      // Deterministically seed / fetch 5 questions using deterministic exclude list or simple offset.
      // To mimic a real daily challenge, we will pull 5 mixed questions.
      const q1 = await getQuestion('mixed', 'any', []);
      const q2 = await getQuestion('mixed', 'any', [q1.id]);
      const q3 = await getQuestion('mixed', 'any', [q1.id, q2.id]);
      const q4 = await getQuestion('mixed', 'any', [q1.id, q2.id, q3.id]);
      const q5 = await getQuestion('mixed', 'any', [q1.id, q2.id, q3.id, q4.id]);
      setQuestions([q1, q2, q3, q4, q5]);
      setGameState('ready');
    } catch (e) {
      console.error(e);
      setGameState('ready'); // local fallback or simple dummy question
    }
  };

  const handleStart = () => {
    playSound.click();
    setGameState('playing');
    setScore(0);
    setCurrentIdx(0);
    setAnswered(false);
  };

  const handleGuessSubmit = () => {
    if (!selectedGuess || answered) return;
    playSound.click();

    const q = questions[currentIdx];
    const correct = q.answer.toLowerCase() === selectedGuess.toLowerCase();
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      playSound.correct();
      setScore((s) => s + 100);
    } else {
      playSound.wrong();
    }
  };

  const handleNext = () => {
    playSound.click();
    if (currentIdx >= 4) {
      // End game
      localStorage.setItem(storageKey, score.toString());
      setGameState('gameover');
      playSound.gameOver();
      canvasConfetti({ particleCount: 150, spread: 80 });
    } else {
      setCurrentIdx((i) => i + 1);
      setAnswered(false);
      setSelectedGuess('');
    }
  };

  const currentQuestion = questions[currentIdx];

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      {gameState === 'loading' && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {gameState === 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 text-center glow-purple space-y-6"
        >
          <Calendar className="mx-auto text-indigo-500" size={56} />
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Daily Challenge</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Test your senses with today's standard 5 questions. You only get one attempt!
            </p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 rounded-2xl font-semibold text-sm">
            📅 Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStart}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
            >
              Start Attempt
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition"
            >
              Main Menu
            </button>
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-6 text-center glow-emerald space-y-4"
        >
          <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Already Completed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You've already solved today's daily challenge. Come back tomorrow for a new set of puzzles!
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl font-mono text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            Your Score: {score} / 500
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
          >
            Return to Menu
          </button>
        </motion.div>
      )}

      {gameState === 'playing' && currentQuestion && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/5 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Challenge</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Question {currentIdx + 1} / 5
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase block">Score</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{score} pts</span>
            </div>
          </div>

          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden"
          >
            <span className="absolute top-4 right-4 text-xs font-semibold uppercase px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
              {currentQuestion.type.toUpperCase()}
            </span>

            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{currentQuestion.title}</h4>

            <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 mb-6 border border-slate-200/50 dark:border-slate-800/50 max-h-[300px] overflow-y-auto">
              {currentQuestion.type === 'code' ? (
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 whitespace-pre-wrap">{currentQuestion.content}</pre>
              ) : currentQuestion.type === 'image' || currentQuestion.type === 'artwork' ? (
                <img src={currentQuestion.content} alt={currentQuestion.title} className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{currentQuestion.content}</p>
              )}
            </div>

            {!answered ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {['Human', 'AI'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedGuess(option)}
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
                <button
                  onClick={handleGuessSubmit}
                  disabled={!selectedGuess}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${isCorrect ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'}`}>
                  {isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                  <div>
                    <p className="font-extrabold text-lg">{isCorrect ? 'Correct!' : 'Wrong!'}</p>
                    <p className="text-sm">Answer is {currentQuestion.answer}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
                  {currentQuestion.explanation}
                </p>

                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {gameState === 'gameover' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 text-center glow-purple space-y-6"
        >
          <Trophy className="mx-auto text-amber-500 fill-amber-500 animate-bounce" size={64} />
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Challenge Completed!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Nice job on completing today's puzzle</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 max-w-sm mx-auto">
            <span className="text-xs text-slate-400 uppercase font-bold">Your Score</span>
            <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{score} / 500</p>
          </div>

          <button
            onClick={onBack}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
          >
            Return to Menu
          </button>
        </motion.div>
      )}
    </div>
  );
}
