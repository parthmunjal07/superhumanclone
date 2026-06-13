import React, { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Archive, Trash2, Reply, Forward, Send, Bot, CalendarPlus, ListChecks, SlidersHorizontal, MoreHorizontal, CircleAlert, CircleCheck } from 'lucide-react';
import { format } from 'date-fns';

export interface ReadingPaneProps {
  email: {
    id: string;
    subject: string;
    body: string;
    from: string;
    to: string;
    date: string;
    priorityLevel?: string | null;
  } | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
}

export default function ReadingPane({ email, onArchive, onDelete, onReply }: ReadingPaneProps) {
  const [isDecisionLogOpen, setIsDecisionLogOpen] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 bg-[#111] flex flex-col items-center justify-center">
        <p className="text-sm text-zinc-600">Select an email to view</p>
      </div>
    );
  }

  const sanitizedHtml = DOMPurify.sanitize(email.body);
  const emailDate = new Date(email.date);

  // Extract sender info
  const senderMatch = email.from.match(/^([^<]+)<([^>]+)>/);
  const senderName = senderMatch ? senderMatch[1].trim() : email.from;
  const senderEmail = senderMatch ? senderMatch[2].trim() : email.from;
  const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Priority config
  const priorityConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    High:   { dot: 'bg-red-500',    bg: 'bg-red-500/20',    text: 'text-red-400',    label: 'URGENT' },
    Normal: { dot: 'bg-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'NORMAL' },
    Low:    { dot: 'bg-zinc-500',   bg: 'bg-zinc-700/50',   text: 'text-zinc-400',   label: 'FYI' },
  };
  const priority = email.priorityLevel ? priorityConfig[email.priorityLevel] : null;

  return (
    <div className="flex-1 bg-[#111] flex flex-col h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 flex items-center justify-between px-5 border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onReply(email.id)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            onClick={() => onReply(email.id)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
            title="Reply"
          >
            <Reply className="h-4 w-4" />
          </button>
          <button
            onClick={() => onArchive(email.id)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(email.id)}
            className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => alert('Send to Slack integration coming soon!')} className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-zinc-300 bg-[#2a2a2a] hover:bg-[#333] border border-[#333] rounded-md transition-colors">
            <span className="text-zinc-500">#</span>
            Send to Slack
          </button>
          <button onClick={() => alert('More options coming soon!')} className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {/* Priority Badge + Decision Log */}
          <div className="flex items-center justify-between mb-4">
            {priority ? (
              <div className="flex items-center gap-2">
                <div className={`w-[7px] h-[7px] rounded-full ${priority.dot}`} />
                <span className={`text-[10px] font-bold tracking-wider font-mono ${priority.text}`}>
                  {priority.label}
                </span>
              </div>
            ) : <div />}

            <button
              onClick={() => setIsDecisionLogOpen(!isDecisionLogOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-zinc-400 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-md transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Decision Log
            </button>
          </div>

          {/* Subject */}
          <h1 className="text-[22px] font-bold text-white mb-6 leading-snug tracking-tight">
            {email.subject}
          </h1>

          {/* AI Summary */}
          <div className="mb-6 p-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-zinc-500" />
              <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider font-mono">AI Summary</h4>
            </div>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              {senderName} is requesting approval on the revised Q3 milestones before end of day. Engineering is blocked on the timeline. Two open questions remain regarding the mobile launch date and budget reallocation.
            </p>
          </div>

          {/* Decision Log (shown when open) */}
          {isDecisionLogOpen && (
            <div className="mb-6 p-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl space-y-5 animate-in slide-in-from-top-2 duration-200">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CircleAlert className="w-3.5 h-3.5 text-orange-400" />
                  <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Open Questions</h5>
                </div>
                <ul className="space-y-1.5 pl-5">
                  <li className="text-[13px] text-zinc-400 list-disc">Confirm the mobile launch date for the new cycle</li>
                  <li className="text-[13px] text-zinc-400 list-disc">Approve the $40k budget reallocation to QA</li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CircleCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Action Items</h5>
                </div>
                <ul className="space-y-1.5 pl-5">
                  <li className="text-[13px] text-zinc-400 list-disc">Sign off on roadmap before EOD</li>
                  <li className="text-[13px] text-zinc-400 list-disc">Notify eng team once approved</li>
                </ul>
              </div>
            </div>
          )}

          {/* Sender Header */}
          <div className="flex items-start gap-3 mb-6 pt-2 border-t border-[#2a2a2a]">
            <div className="w-9 h-9 rounded-full bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[11px] font-bold text-zinc-500 shrink-0 mt-1">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-white">{senderName}</p>
              <p className="text-[12px] text-zinc-600 font-mono">{senderEmail}</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-600 tabular-nums shrink-0 pt-1">
              {format(emailDate, "EEE, h:mm a").replace(',', ',')}
            </span>
          </div>

          {/* Email Body */}
          <div
            className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-p:leading-relaxed prose-a:text-indigo-400 prose-strong:text-zinc-200 text-[14px] mb-6"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

          {/* Smart Chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={() => alert('Calendar integration coming soon!')} className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors">
              <CalendarPlus className="w-3.5 h-3.5 text-zinc-500" />
              Add to calendar
              <span className="text-zinc-600 font-mono text-[11px]">Fri 2pm</span>
            </button>
            <button onClick={() => alert('Linear integration coming soon!')} className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors">
              <ListChecks className="w-3.5 h-3.5 text-zinc-500" />
              Create Linear issue
            </button>
          </div>

          {/* Reply / Forward buttons */}
          <div className="flex gap-2 pt-4 border-t border-[#2a2a2a]">
            <button
              onClick={() => onReply(email.id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors"
            >
              <Reply className="w-4 h-4 text-zinc-500" />
              Reply
            </button>
            <button 
              onClick={() => onReply(email.id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors">
              <Forward className="w-4 h-4 text-zinc-500" />
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
