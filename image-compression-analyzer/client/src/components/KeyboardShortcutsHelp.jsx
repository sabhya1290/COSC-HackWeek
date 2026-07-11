import React from 'react';
import { Keyboard, X } from 'lucide-react';

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 rounded-xl glass-card border border-cyan-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center space-x-2">
            <Keyboard className="text-cyan-400" size={16} />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">KEY_BINDINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-900 text-slate-500 hover:text-cyan-400 rounded transition"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 text-[10px] font-bold uppercase text-slate-400">
          <div className="flex justify-between items-center py-1">
            <span>TOGGLE_COLOR_THEME</span>
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded">Shift + T</kbd>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-900">
            <span>TOGGLE_VIEW_MODE</span>
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded">Shift + B</kbd>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-900">
            <span>RESET_VIEWPORT</span>
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded">Shift + R</kbd>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-900">
            <span>CLOSE_VIEW_ESC</span>
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded">Esc</kbd>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-slate-900">
            <span>SHOW_SYSTEM_HELP</span>
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded">?</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
