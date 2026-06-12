import React from 'react';
import { X } from 'lucide-react';

export default function ShortcutOverlay({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'c', description: 'Compose new email' },
    { key: 'r', description: 'Reply to selected email' },
    { key: 'e', description: 'Archive selected email' },
    { key: '/', description: 'Search emails' },
    { key: '?', description: 'Toggle this overlay' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
              <span className="text-sm text-zinc-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-mono font-semibold text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-md shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
