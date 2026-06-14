import React, { useState, useEffect } from 'react';
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
  const [decisionLog, setDecisionLog] = useState<any>(null);
  const [isDecisionLogLoading, setIsDecisionLogLoading] = useState(false);

  const [smartChips, setSmartChips] = useState<any>(null);
  const [isSmartChipsLoading, setIsSmartChipsLoading] = useState(false);

  // Reset states when email changes
  useEffect(() => {
    setIsDecisionLogOpen(false);
    setDecisionLog(null);
    setSmartChips(null);
    
    if (email?.id) {
      setIsSmartChipsLoading(true);
      fetch(`/api/emails/${email.id}/smart-chips`)
        .then(res => res.json())
        .then(data => setSmartChips(data))
        .catch(err => console.error(err))
        .finally(() => setIsSmartChipsLoading(false));
    }
  }, [email?.id]);

  const toggleDecisionLog = async () => {
    if (!isDecisionLogOpen) {
      setIsDecisionLogOpen(true);
      if (!decisionLog && email?.id) {
        setIsDecisionLogLoading(true);
        try {
          const res = await fetch(`/api/emails/${email.id}/decision-log`);
          if (res.ok) {
            const data = await res.json();
            setDecisionLog(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsDecisionLogLoading(false);
        }
      }
    } else {
      setIsDecisionLogOpen(false);
    }
  };

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
    URGENT: { dot: 'bg-red-500',    bg: 'bg-red-500/20',    text: 'text-red-400',    label: 'URGENT' },
    NORMAL: { dot: 'bg-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'NORMAL' },
    FYI:    { dot: 'bg-zinc-500',   bg: 'bg-zinc-700/50',   text: 'text-zinc-400',   label: 'FYI' },
  };
  const priority = email.priorityLevel ? priorityConfig[email.priorityLevel.toUpperCase()] : null;

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
              onClick={toggleDecisionLog}
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

          {/* Decision Log (shown when open) */}
          {isDecisionLogOpen && (
            <div className="mb-6 p-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl space-y-5 animate-in slide-in-from-top-2 duration-200">
              {isDecisionLogLoading ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
                  <span className="text-[12px] font-mono tracking-wider uppercase">Generating Decision Log...</span>
                </div>
              ) : decisionLog ? (
                <>
                  {/* TLDR */}
                  {decisionLog.tlDr && (
                    <div className="mb-4 text-[13px] text-zinc-300 border-b border-[#2a2a2a] pb-4">
                      {decisionLog.tlDr}
                    </div>
                  )}

                  {/* Decisions Made */}
                  {decisionLog.decisionsMade && decisionLog.decisionsMade.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CircleCheck className="w-3.5 h-3.5 text-blue-400" />
                        <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Decisions Made</h5>
                      </div>
                      <ul className="space-y-1.5 pl-5">
                        {decisionLog.decisionsMade.map((d: string, i: number) => (
                          <li key={i} className="text-[13px] text-zinc-400 list-disc">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Open Questions */}
                  {decisionLog.openQuestions && decisionLog.openQuestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CircleAlert className="w-3.5 h-3.5 text-orange-400" />
                        <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Open Questions</h5>
                      </div>
                      <ul className="space-y-1.5 pl-5">
                        {decisionLog.openQuestions.map((q: string, i: number) => (
                          <li key={i} className="text-[13px] text-zinc-400 list-disc">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {decisionLog.actionItems && decisionLog.actionItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                        <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Action Items</h5>
                      </div>
                      <ul className="space-y-1.5 pl-5">
                        {decisionLog.actionItems.map((a: any, i: number) => (
                          <li key={i} className="text-[13px] text-zinc-400 list-disc">
                            <span className="text-white font-medium">{a.owner}:</span> {a.task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[12px] text-red-400 font-mono tracking-wider">Failed to generate log</div>
              )}
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
          <div className="flex flex-wrap gap-2 mb-8 min-h-[36px]">
            {isSmartChipsLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-zinc-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
                Analyzing context...
              </div>
            )}
            {!isSmartChipsLoading && smartChips?.hasMeeting && (
              <button onClick={() => alert('Calendar integration ready via Corsair!')} className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors">
                <CalendarPlus className="w-3.5 h-3.5 text-zinc-500" />
                Add to calendar
                {smartChips.suggestedTime && (
                  <span className="text-zinc-600 font-mono text-[11px] ml-1">{smartChips.suggestedTime}</span>
                )}
              </button>
            )}
            {!isSmartChipsLoading && smartChips?.hasBugOrFeature && (
              <button onClick={() => alert('Linear integration ready via Corsair!')} className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-zinc-300 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-lg transition-colors">
                <ListChecks className="w-3.5 h-3.5 text-zinc-500" />
                Create Linear issue
              </button>
            )}
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
