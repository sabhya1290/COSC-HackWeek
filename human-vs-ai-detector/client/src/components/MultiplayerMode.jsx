import React, { useState, useEffect } from 'react';
import { getQuestion } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Trophy, Play, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { playSound } from './AudioSynth';
import canvasConfetti from 'canvas-confetti';

export default function MultiplayerMode({ onBack }) {
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, gameover
  const [players, setPlayers] = useState([
    { name: 'Player 1', score: 0, accuracy: 0, correct: 0, wrong: 0 },
    { name: 'Player 2', score: 0, accuracy: 0, correct: 0, wrong: 0 },
  ]);
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');

  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0); // 0 = Player 1, 1 = Player 2
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [playedIds, setPlayedIds] = useState([]);

  const startMultiplayer = () => {
    playSound.click();
    setPlayers([
      { name: p1Name.trim() || 'Player 1', score: 0, accuracy: 0, correct: 0, wrong: 0 },
      { name: p2Name.trim() || 'Player 2', score: 0, accuracy: 0, correct: 0, wrong: 0 },
    ]);
    setGameState('playing');
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
    setPlayedIds([]);
    loadNewQuestion([]);
  };

  const loadNewQuestion = async (excludeList) => {
    setLoading(true);
    setAnswered(false);
    setSelectedGuess('');
    try {
      const q = await getQuestion('mixed', 'any', excludeList);
      setQuestion(q);
      setPlayedIds((prev) => [...prev, q.id]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGuessSubmit = () => {
    if (!selectedGuess || answered) return;
    playSound.click();

    const correct = question.answer.toLowerCase() === selectedGuess.toLowerCase();
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      playSound.correct();
    } else {
      playSound.wrong();
    }

    // Update current player stats
    setPlayers((prev) => {
      const copy = [...prev];
      const p = copy[currentPlayerIdx];
      if (correct) {
        p.correct += 1;
        p.score += 100;
      } else {
        p.wrong += 1;
      }
      p.accuracy = Math.round((p.correct / (p.correct + p.wrong)) * 100);
      return copy;
    });
  };

  const handleNext = () => {
    playSound.click();
    
    // Switch player
    if (currentPlayerIdx === 0) {
      setCurrentPlayerIdx(1);
      loadNewQuestion(playedIds);
    } else {
      // Both players played one round, move to next round
      if (currentRound >= 5) {
        // End game
        setGameState('gameover');
        playSound.gameOver();
        canvasConfetti({ particleCount: 150, spread: 80 });
      } else {
        setCurrentRound((r) => r + 1);
        setCurrentPlayerIdx(0);
        loadNewQuestion(playedIds);
      }
    }
  };

  const activePlayer = players[currentPlayerIdx];

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {gameState === 'lobby' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 glow-purple"
        >
          <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-4 hover:underline">
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 text-center">
            ⚔️ Local VS Lobby
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Player 1 (Human/AI Investigator)</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Player 2 (Human/AI Investigator)</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={startMultiplayer}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Play size={18} /> Start Duel (5 Rounds)
          </button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/5 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Round {currentRound} / 5</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                <User className="text-indigo-500" size={20} /> {activePlayer.name}'s Turn
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase block">Current Score</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{activePlayer.score} pts</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : question && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-3xl p-6 relative overflow-hidden"
            >
              <span className="absolute top-4 right-4 text-xs font-semibold uppercase px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                {question.type.toUpperCase()}
              </span>

              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{question.title}</h4>

              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 mb-6 border border-slate-200/50 dark:border-slate-800/50 max-h-[300px] overflow-y-auto">
                {question.type === 'code' ? (
                  <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 whitespace-pre-wrap">{question.content}</pre>
                ) : question.type === 'image' || question.type === 'artwork' ? (
                  <img src={question.content} alt={question.title} className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{question.content}</p>
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
                    Lock Guess
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
                      <p className="text-sm">Answer is {question.answer}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
                    {question.explanation}
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
          )}
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
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Duel Complete!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Here is the final score tally</p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            {players.map((p, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">{p.name}</h4>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{p.score} pts</p>
                <p className="text-xs text-slate-400 mt-1">{p.accuracy}% Accuracy</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded-2xl font-extrabold text-lg">
            🏆 {players[0].score === players[1].score ? "It's a Tie!" : (players[0].score > players[1].score ? `${players[0].name} Wins!` : `${players[1].name} Wins!`)}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setGameState('lobby')}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition"
            >
              Main Menu
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
