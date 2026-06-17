'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { RefreshCcw, CheckCircle2, Clock, Calendar, MessageSquare, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error("Failed to fetch digest");
  return r.json();
});

export default function DigestPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/digest', fetcher);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { user } = useAuth();
  const isDemoUser = user?.id === 'demo-user';

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/digest', { method: 'POST' });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to regenerate:', errorText);
        alert('Failed to regenerate digest: ' + errorText);
      }
      await mutate();
    } catch (e) {
      console.error(e);
      alert('Error regenerating digest.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const todayStr = format(new Date(), 'EEEE, MMMM do');

  // Loading State
  if (isLoading || !data) {
    return (
      <div className="flex-1 bg-[#F9FAFB] h-full overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-48 bg-zinc-200 rounded-lg"></div>
          <div className="h-24 w-full bg-zinc-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] bg-zinc-200 rounded-3xl"></div>
            <div className="space-y-6">
              <div className="h-[200px] bg-zinc-200 rounded-3xl"></div>
              <div className="h-[200px] bg-zinc-200 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9FAFB] h-full">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Digest Unavailable</h2>
        <p className="text-zinc-500 mb-6">We couldn't load your morning digest.</p>
        <button onClick={() => mutate()} className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-medium shadow-sm hover:bg-zinc-800 transition">
          Try Again
        </button>
      </div>
    );
  }

  const { focusSuggestion, actionItems, meetings, waitingOn, fyi } = data;

  return (
    <div className="flex-1 bg-[#F9FAFB] h-full overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10 lg:px-12 lg:py-16 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-zinc-400 font-bold tracking-widest text-[11px] uppercase mb-1.5">{todayStr}</p>
            <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Morning Brief</h1>
          </div>
          <button 
            onClick={handleRegenerate}
            disabled={isRegenerating || isDemoUser}
            title={isDemoUser ? "Refresh is disabled in Demo Mode" : ""}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-full shadow-sm hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            {isRegenerating ? 'Generating...' : 'Refresh Digest'}
          </button>
        </div>

        {/* Hero: Focus Suggestion */}
        {focusSuggestion && (
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400"></div>
            <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5 text-emerald-500" /> Today's Primary Focus
            </p>
            <h2 className="text-[17px] font-medium text-zinc-900 leading-snug tracking-tight">
              {focusSuggestion}
            </h2>
          </div>
        )}

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Action Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-900" />
              <h3 className="text-[14px] font-semibold text-zinc-900">Action Items</h3>
            </div>
            
            {(!actionItems || actionItems.length === 0) ? (
              <div className="bg-white border border-zinc-100 rounded-2xl p-6 text-center text-[13px] text-zinc-500">
                You're all caught up. No pending action items!
              </div>
            ) : (
              <div className="space-y-4">
                {actionItems.map((item: any, idx: number) => {
                  let badgeStyle = "bg-zinc-100 text-zinc-600";
                  if (item.type === 'reply') badgeStyle = "bg-[#CBE4FF] text-[#1E4C82]";
                  if (item.type === 'decide') badgeStyle = "bg-[#E3D1FE] text-[#482881]";
                  if (item.type === 'delegate') badgeStyle = "bg-[#FFE2D1] text-[#85451C]";

                  return (
                    <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-4 mb-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md ${badgeStyle}`}>
                          {item.type}
                        </span>
                      </div>
                      <h4 className="text-zinc-900 font-medium text-[14px] mb-1.5 leading-snug group-hover:text-blue-600 transition-colors">
                        {item.text}
                      </h4>
                      <p className="text-zinc-500 text-[13px]">
                        From: {item.from}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Stacked Bento Cards */}
          <div className="space-y-8">
            
            {/* Meetings Prep */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-4 h-4 text-zinc-900" />
                <h3 className="text-[14px] font-semibold text-zinc-900">Upcoming Meetings</h3>
              </div>
              
              {(!meetings || meetings.length === 0) ? (
                <p className="text-zinc-500 text-[13px]">No meetings requiring prep today.</p>
              ) : (
                <div className="space-y-5">
                  {meetings.map((m: any, i: number) => (
                    <div key={i} className="border-l-[3px] border-zinc-200 pl-3 py-0.5">
                      <h4 className="text-[14px] font-medium text-zinc-900 leading-tight mb-0.5">{m.title}</h4>
                      {m.time && <p className="text-[12px] text-zinc-500 mb-1.5">{m.time} {m.attendees?.length > 0 && `• ${m.attendees.join(', ')}`}</p>}
                      {m.notes && m.notes.length > 0 && (
                        <ul className="text-[13px] text-zinc-600 leading-relaxed list-disc list-inside">
                          {m.notes.map((n: string, idx: number) => <li key={idx}>{n}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Waiting On */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-[14px] font-semibold text-zinc-900">Waiting On</h3>
              </div>
              
              {(!waitingOn || waitingOn.length === 0) ? (
                <p className="text-zinc-500 text-[13px]">Nothing pending from others.</p>
              ) : (
                <ul className="space-y-3">
                  {waitingOn.map((w: any, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[13px] font-medium text-zinc-900">{w.name}</span>
                        {w.sent && <span className="text-[11px] text-zinc-400 ml-2">{w.sent}</span>}
                        <p className="text-[13px] text-zinc-600 leading-snug mt-0.5">{w.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* FYI */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h3 className="text-[14px] font-semibold text-zinc-900">FYI</h3>
              </div>
              
              {(!fyi || fyi.length === 0) ? (
                <p className="text-zinc-500 text-[13px]">No recent FYI notices.</p>
              ) : (
                <ul className="space-y-4">
                  {fyi.map((note: any, i: number) => (
                    <li key={i} className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-100">
                      <h4 className="text-[13px] font-medium text-zinc-900 mb-0.5">{note.title}</h4>
                      <p className="text-[13px] text-zinc-600 leading-relaxed">{note.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}