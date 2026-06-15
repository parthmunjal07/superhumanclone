import React, { useState, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Archive, Trash2, Reply, Forward, Send, Bot, CalendarPlus, ListChecks, SlidersHorizontal, MoreHorizontal, CircleAlert, CircleCheck, X, ChevronLeft } from 'lucide-react';
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
  onClose?: () => void;
}

export default function ReadingPane({ email, onArchive, onDelete, onReply, onClose }: ReadingPaneProps) {
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
      <div className="flex-1 bg-[#F9FAFB] flex flex-col items-center justify-center font-sans">
        <p className="text-sm text-zinc-400 font-medium tracking-wide uppercase">Select an email to view</p>
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

  // Priority config (Light theme updated)
  const priorityConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    URGENT: { dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-600',    label: 'URGENT' },
    NORMAL: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', label: 'NORMAL' },
    FYI:    { dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'FYI' },
  };
  const priority = email.priorityLevel ? priorityConfig[email.priorityLevel.toUpperCase()] : null;

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden font-sans shadow-sm">
      {/* Top Toolbar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 shrink-0 bg-white">
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 mr-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1.5 font-semibold text-[13px]"
              title="Back"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <button
            onClick={() => onReply(email.id)}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            onClick={() => onReply(email.id)}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Reply"
          >
            <Reply className="h-4 w-4" />
          </button>
          <button
            onClick={() => onArchive(email.id)}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(email.id)}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => alert('More options coming soon!')} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-10 py-10">
          
          {/* Priority Badge + Decision Log Control */}
          <div className="flex items-center justify-between mb-6">
            {priority ? (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${priority.dot}`} />
                <span className={`text-[11px] font-bold tracking-widest font-mono uppercase ${priority.text}`}>
                  {priority.label}
                </span>
              </div>
            ) : <div />}

            <button
              onClick={toggleDecisionLog}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold tracking-wider uppercase text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Decision Log
            </button>
          </div>

          {/* Subject */}
          <h1 className="text-[28px] font-bold text-zinc-900 mb-8 leading-snug tracking-tight">
            {email.subject}
          </h1>

          {/* Decision Log (shown when open) */}
          {isDecisionLogOpen && (
            <div className="mb-8 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-6 shadow-sm">
              {isDecisionLogLoading ? (
                <div className="flex items-center gap-3 text-zinc-500">
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                  <span className="text-[12px] font-bold tracking-wider uppercase">Generating Decision Log...</span>
                </div>
              ) : decisionLog ? (
                <>
                  {/* TLDR */}
                  {decisionLog.tlDr && (
                    <div className="mb-4 text-[14px] text-zinc-700 border-b border-zinc-200 pb-5 leading-relaxed">
                      {decisionLog.tlDr}
                    </div>
                  )}

                  {/* Decisions Made */}
                  {decisionLog.decisionsMade && decisionLog.decisionsMade.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CircleCheck className="w-4 h-4 text-blue-500" />
                        <h5 className="text-[12px] font-bold text-zinc-600 uppercase tracking-widest">Decisions Made</h5>
                      </div>
                      <ul className="space-y-2 pl-6">
                        {decisionLog.decisionsMade.map((d: string, i: number) => (
                          <li key={i} className="text-[14px] text-zinc-600 list-disc">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Open Questions */}
                  {decisionLog.openQuestions && decisionLog.openQuestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CircleAlert className="w-4 h-4 text-orange-500" />
                        <h5 className="text-[12px] font-bold text-zinc-600 uppercase tracking-widest">Open Questions</h5>
                      </div>
                      <ul className="space-y-2 pl-6">
                        {decisionLog.openQuestions.map((q: string, i: number) => (
                          <li key={i} className="text-[14px] text-zinc-600 list-disc">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {decisionLog.actionItems && decisionLog.actionItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ListChecks className="w-4 h-4 text-emerald-500" />
                        <h5 className="text-[12px] font-bold text-zinc-600 uppercase tracking-widest">Action Items</h5>
                      </div>
                      <ul className="space-y-2 pl-6">
                        {decisionLog.actionItems.map((a: any, i: number) => (
                          <li key={i} className="text-[14px] text-zinc-600 list-disc">
                            <span className="text-zinc-900 font-semibold">{a.owner}:</span> {a.task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[12px] text-red-500 font-bold tracking-wider uppercase">Failed to generate log</div>
              )}
            </div>
          )}

          {/* Sender Header */}
          <div className="flex items-start gap-4 mb-8 pt-4 border-t border-zinc-100">
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[13px] font-bold text-zinc-600 shrink-0 mt-0.5">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-zinc-900">{senderName}</p>
              <p className="text-[13px] text-zinc-500">{senderEmail}</p>
            </div>
            <span className="text-[12px] font-medium text-zinc-500 tabular-nums shrink-0 pt-1">
              {format(emailDate, "EEE, h:mm a").replace(',', ',')}
            </span>
          </div>

          {/* Email Body */}
          <div
            className="prose prose-zinc max-w-none text-[15px] leading-loose mb-10 text-zinc-800 prose-headings:text-zinc-900 prose-a:text-blue-600"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />

          {/* Smart Chips */}
          <div className="flex flex-wrap gap-3 mb-10 min-h-[40px]">
            {isSmartChipsLoading && (
              <div className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                Analyzing context...
              </div>
            )}
            {!isSmartChipsLoading && smartChips?.hasMeeting && (
              <button onClick={() => alert('Calendar integration ready via Corsair!')} className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm rounded-xl transition-colors">
                <CalendarPlus className="w-4 h-4 text-[#1E4C82]" />
                Add to calendar
                {smartChips.suggestedTime && (
                  <span className="text-zinc-500 font-medium ml-1 bg-zinc-100 px-2 py-0.5 rounded-md">{smartChips.suggestedTime}</span>
                )}
              </button>
            )}
          </div>

          {/* Reply / Forward buttons */}
          <div className="flex gap-3 pt-6 border-t border-zinc-100">
            <button
              onClick={() => onReply(email.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm rounded-xl transition-colors"
            >
              <Reply className="w-4 h-4 text-zinc-500" />
              Reply
            </button>
            <button 
              onClick={() => onReply(email.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm rounded-xl transition-colors">
              <Forward className="w-4 h-4 text-zinc-500" />
              Forward
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
