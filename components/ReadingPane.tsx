import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Archive, Trash2, Reply, Bot } from 'lucide-react';
import { format } from 'date-fns';

export interface ReadingPaneProps {
  email: {
    id: string;
    subject: string;
    body: string;
    from: string;
    to: string;
    date: string;
  } | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
}

export default function ReadingPane({ email, onArchive, onDelete, onReply }: ReadingPaneProps) {
  if (!email) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-zinc-500">
        <p>Select an email to view</p>
      </div>
    );
  }

  const sanitizedHtml = DOMPurify.sanitize(email.body);
  const emailDate = new Date(email.date);

  return (
    <div className="flex-1 bg-black flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0 gap-4">
        <button 
          onClick={() => onArchive(email.id)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          title="Archive"
        >
          <Archive className="h-5 w-5" />
        </button>
        <button 
          onClick={() => onDelete(email.id)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button 
          onClick={() => onReply(email.id)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors ml-auto"
          title="Reply"
        >
          <Reply className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        {/* AI Summary Block */}
        <div className="mb-8 p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-lg flex gap-3">
          <Bot className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-indigo-300 mb-1">AI Summary</h4>
            <p className="text-sm text-indigo-200/80">
              This email requires your attention regarding the upcoming project deadline. The sender is asking for an update on the latest deliverables.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">{email.subject}</h1>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-medium">{email.from}</p>
              <p className="text-xs text-zinc-500 mt-1">to {email.to}</p>
            </div>
            <div className="text-sm text-zinc-400">
              {format(emailDate, 'MMM d, yyyy, h:mm a')}
            </div>
          </div>
        </div>

        {/* Body */}
        <div 
          className="prose prose-invert max-w-none prose-a:text-indigo-400 prose-p:leading-relaxed text-zinc-300"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
}
