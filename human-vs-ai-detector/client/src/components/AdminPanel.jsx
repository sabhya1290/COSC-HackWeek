import React, { useState } from 'react';
import { adminAddQuestion } from '../utils/api';
import { ArrowLeft, Save, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from './AudioSynth';

export default function AdminPanel({ onBack }) {
  const [formData, setFormData] = useState({
    type: 'text',
    difficulty: 'medium',
    title: '',
    content: '',
    answer: 'AI',
    explanation: '',
    clues: '',
    confidence: '80',
    hint: ''
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playSound.click();
    setLoading(true);
    setMsg({ text: '', type: '' });

    if (!formData.title || !formData.content || !formData.explanation) {
      setMsg({ text: 'Please fill in all required fields.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await adminAddQuestion({
        ...formData,
        confidence: Number(formData.confidence)
      });
      setMsg({ text: 'Question added successfully!', type: 'success' });
      setFormData({
        type: 'text',
        difficulty: 'medium',
        title: '',
        content: '',
        answer: 'AI',
        explanation: '',
        clues: '',
        confidence: '80',
        hint: ''
      });
    } catch (err) {
      setMsg({ text: 'Error adding question. Make sure backend is running.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-4"
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { playSound.click(); onBack(); }}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Plus size={24} className="text-indigo-500" /> Add New Question
        </h1>
      </div>

      <div className="glass-card rounded-2xl p-6 glow-purple">
        <form onSubmit={handleSubmit} className="space-y-4">
          {msg.text && (
            <div className={`p-4 rounded-xl flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'}`}>
              {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{msg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Content Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="text">📝 Text</option>
                <option value="image">🖼 Image</option>
                <option value="code">💻 Code</option>
                <option value="artwork">🎨 Artwork</option>
                <option value="voice">🎙 Voice Clip</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="impossible">Impossible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Author/Source Answer</label>
            <select
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="AI">AI</option>
              <option value="Human">Human</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Title (e.g. 'Watercolor of Paris')</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Simple Python script"
              className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Content (Text, code snippet, or Image URL)</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Paste code, write paragraph, or insert direct image URL here..."
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Detailed Explanation</label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleChange}
              placeholder="Explain why this content was created by human or AI..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">AI Confidence (0-100%)</label>
              <input
                type="number"
                name="confidence"
                value={formData.confidence}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Hint (Optional)</label>
              <input
                type="text"
                name="hint"
                value={formData.hint}
                onChange={handleChange}
                placeholder="Give players a small tip..."
                className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Clues (Comma separated list)</label>
            <input
              type="text"
              name="clues"
              value={formData.clues}
              onChange={handleChange}
              placeholder="e.g. Formal tone, No brush strokes, Perfect margins"
              className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Question'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
