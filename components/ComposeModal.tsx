import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mail, Users, PenLine, Sparkles, AtSign } from 'lucide-react';

export interface ComposeModalProps {
  onClose: () => void;
  onSend: (payload: { to: string; subject: string; body: string }) => Promise<void>;
  replyTo?: { to: string; subject: string } | null;
}

export default function ComposeModal({ onClose, onSend, replyTo }: ComposeModalProps) {
  const [to, setTo] = useState(replyTo?.to || '');
  const [subject, setSubject] = useState(replyTo?.subject ? (replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`) : '');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!to) {
      document.getElementById('compose-to')?.focus();
    } else {
      bodyRef.current?.focus();
    }
  }, [to]);

  const handleSend = async () => {
    if (isSending) return;

    const bodyText = bodyRef.current?.innerText || '';

    if (!to) {
      setError("Please specify a recipient.");
      return;
    }

    if (bodyText.length > 100000) {
      setError("Message body is too large.");
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      await onSend({ to, subject, body: bodyText });
      onClose();
    } catch (err) {
      setError("Failed to send email. Please try again.");
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Mock chips for the visual (in a real app, this would be derived from the 'to' state)
  const renderChips = () => {
    if (to && to.includes(',')) {
      return to.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-[#2a2a2a] border border-[#333] rounded-full px-3 py-1 mr-2 text-[13px] text-zinc-300">
          <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
          {t}
          <button className="text-zinc-500 hover:text-zinc-300 ml-1"><X className="w-3 h-3" /></button>
        </div>
      ));
    }
    
    // For visual match with the screenshot if 'to' is empty
    if (!to) {
      return (
        <>
          <div className="flex items-center gap-1.5 bg-[#2a2a2a] border border-[#333] rounded-full px-3 py-1 mr-2 text-[13px] text-zinc-300">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            elena@orbit.io
            <button className="text-zinc-500 hover:text-zinc-300 ml-1"><X className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center gap-1.5 bg-[#2a2a2a] border border-[#333] rounded-full px-3 py-1 mr-2 text-[13px] text-zinc-300">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            marcus@orbit.io
            <button className="text-zinc-500 hover:text-zinc-300 ml-1"><X className="w-3 h-3" /></button>
          </div>
        </>
      )
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-200">
      <div
        className="w-[700px] bg-[#111111] border border-[#222] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-[#222]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
              <Mail className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight leading-none mb-1.5">Compose message</h2>
              <p className="text-[12px] text-zinc-500 font-medium">Keyboard-centric draft window</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-[12px] font-medium font-mono">
            <button className="hover:text-zinc-300 transition-colors flex items-center gap-1"><AtSign className="w-3.5 h-3.5"/> </button>
            <button className="hover:text-zinc-300 transition-colors tracking-wide">CC</button>
            <button className="hover:text-zinc-300 transition-colors tracking-wide">BCC</button>
            <button onClick={onClose} className="hover:text-white transition-colors ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {error && (
            <div className="px-4 py-2 bg-red-900/50 text-red-300 text-xs border border-red-800/50 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Recipients */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1 text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold tracking-[0.15em]">RECIPIENTS</span>
            </div>
            <div className="flex items-center flex-wrap gap-y-2 bg-[#151515] border border-[#222] rounded-xl px-3 py-2 min-h-[44px] cursor-text" onClick={() => document.getElementById('compose-to')?.focus()}>
              {renderChips()}
              <input
                id="compose-to"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 min-w-[150px] bg-transparent text-zinc-300 text-[13px] font-medium focus:outline-none placeholder:text-zinc-600"
                placeholder={!to ? "Add recipients" : ""}
              />
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-3 px-1 text-zinc-500">
              <div className="flex items-center gap-2">
                <PenLine className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tracking-[0.15em]">MESSAGE</span>
              </div>
              <span className="text-[10px] font-bold tracking-[0.1em] flex items-center gap-1.5 font-mono">
                <span className="font-sans text-[12px] opacity-80">⌘ ↵</span> TO SEND
              </span>
            </div>
            
            <div 
              className="flex-1 bg-[#151515] border border-[#222] rounded-xl p-5 cursor-text overflow-y-auto flex flex-col"
              onClick={() => bodyRef.current?.focus()}
            >
              <input
                id="compose-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-transparent text-white text-[14px] font-medium focus:outline-none mb-4 placeholder:text-zinc-600"
                placeholder="Subject: Q3 roadmap sign-off needed"
              />
              <div
                ref={bodyRef}
                contentEditable
                className="flex-1 outline-none text-zinc-300 text-[14px] prose prose-invert max-w-none leading-relaxed"
                data-placeholder="Write your message..."
                suppressContentEditableWarning={true}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#222] flex items-center justify-between bg-[#151515] shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#333] bg-[#1a1a1a] text-zinc-500 text-[11px] font-mono font-medium tracking-wide">
            <span className="font-sans text-[13px] opacity-80">⌘ ↵</span> to send
          </div>

          <div className="flex items-center gap-5">
            <button className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-[13px] font-medium">
              <Sparkles className="w-4 h-4" />
              AI assist
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="bg-white hover:bg-zinc-200 text-black px-6 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
