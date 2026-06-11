import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Send, Paperclip } from 'lucide-react';

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
    // Focus the right field on open
    if (!to) {
      document.getElementById('compose-to')?.focus();
    } else if (!subject) {
      document.getElementById('compose-subject')?.focus();
    } else {
      bodyRef.current?.focus();
    }
  }, [to, subject]);

  const handleSend = async () => {
    if (isSending) return;
    
    const bodyText = bodyRef.current?.innerHTML || '';
    
    if (!to) {
      setError("Please specify a recipient.");
      return;
    }
    
    // Body size validation (approx 100KB HTML limit)
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      <div 
        className="w-[600px] h-[500px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="h-12 bg-zinc-800 flex items-center justify-between px-4 cursor-pointer shrink-0">
          <span className="text-sm font-semibold text-white">New Message</span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="px-4 py-2 bg-red-900/50 text-red-200 text-xs border-b border-red-800">
              {error}
            </div>
          )}
          
          <div className="flex border-b border-zinc-800 px-4 py-2 items-center">
            <span className="text-zinc-500 text-sm w-12">To:</span>
            <input 
              id="compose-to"
              type="text" 
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none"
              placeholder="recipient@example.com"
            />
            <span className="text-zinc-500 text-xs cursor-pointer hover:text-zinc-300 ml-2">Cc Bcc</span>
          </div>
          
          <div className="flex border-b border-zinc-800 px-4 py-2 items-center">
            <span className="text-zinc-500 text-sm w-12">Subject:</span>
            <input 
              id="compose-subject"
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none font-medium"
              placeholder="Subject"
            />
          </div>

          {/* Rich Text Area */}
          <div className="flex-1 p-4 overflow-y-auto cursor-text" onClick={() => bodyRef.current?.focus()}>
            <div 
              ref={bodyRef}
              contentEditable
              className="outline-none text-zinc-200 text-sm prose prose-invert max-w-none min-h-full"
              data-placeholder="Write your message... (Cmd+Enter to send)"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-14 border-t border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-zinc-900">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSend}
              disabled={isSending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send'}
              <Send className="h-4 w-4" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white rounded-md transition-colors" title="Schedule Send">
              <Clock className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-white rounded-md transition-colors" title="Attach file">
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
