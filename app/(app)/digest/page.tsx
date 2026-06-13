'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Clock, 
  Zap,
  Sparkles
} from 'lucide-react';

const mockDigestData = {
  focusSuggestion: "Your top priority today is signing off on the Q3 roadmap. Marcus and the eng team are blocked.",
  meetings: [
    { 
      id: 1, 
      title: "Q3 Roadmap Review", 
      time: "10:00 - 10:45 AM", 
      attendees: ["MC", "JP", "EM"],
      color: "cyan",
      notes: [
        "Marcus needs approval on the revised launch milestones.",
        "Engineering is blocked on budget reallocation.",
        "Confirm whether the mobile launch date stays Aug 15."
      ]
    },
    { 
      id: 2, 
      title: "Design Critique Sync", 
      time: "1:30 - 2:00 PM", 
      attendees: ["SP", "AR"],
      color: "amber",
      notes: [
        "Tentative until Priya confirms the revised deck.",
        "Review onboarding flow feedback and open questions.",
        "Bring the latest mobile mockups for comparison."
      ]
    },
    { 
      id: 3, 
      title: "Weekly Staff Meeting", 
      time: "4:00 - 4:30 PM", 
      attendees: ["EM", "MC", "LN"],
      color: "cyan",
      notes: [
        "Prepare a concise update on roadmap sign-off.",
        "Highlight any blockers from the eng team.",
        "Share the digest summary with the group."
      ]
    }
  ],
  actionItems: [
    { id: 1, text: "Approve Q3 roadmap milestones", type: "reply", from: "Marcus Chen" },
    { id: 2, text: "Decide on mobile launch date", type: "decide", from: "Engineering" },
    { id: 3, text: "Delegate QA budget reallocation", type: "delegate", from: "Priya Patel" },
    { id: 4, text: "Reply to weekly digest thread", type: "reply", from: "Notion" }
  ],
  waitingOn: [
    { id: 1, initials: "MC", name: "Marcus Chen", text: "Waiting for approval on the revised roadmap.", sent: "2D AGO" },
    { id: 2, initials: "PR", name: "Priya Patel", text: "Needs confirmation on the design review timing.", sent: "6H AGO" },
    { id: 3, initials: "LN", name: "Linear", text: "Issue status update pending from the eng team.", sent: "1D AGO" }
  ],
  fyi: [
    { id: 1, title: "Notion", text: "Weekly workspace digest" },
    { id: 2, title: "GitHub", text: "PR #482 was merged" },
    { id: 3, title: "Figma", text: "New comments on onboarding flow" }
  ]
};

const getActionBadgeStyle = (type: string) => {
  switch (type) {
    case 'reply': return 'bg-[#111f3d]/50 text-blue-400 border border-blue-500/10';
    case 'decide': return 'bg-[#1d1136]/50 text-amber-500 border border-amber-500/10'; // In screenshot "DECIDE" is yellow/amber
    case 'delegate': return 'bg-[#0c2323]/50 text-emerald-400 border border-emerald-500/10';
    default: return 'bg-zinc-800 text-zinc-400';
  }
};

export default function DigestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<typeof mockDigestData | null>(null);

  const fetchDigest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData(mockDigestData);
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchDigest();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] text-white">
      <div className="max-w-[1100px] mx-auto py-12 px-10">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase mb-2">Morning Digest</h2>
            <h1 className="text-[34px] font-bold text-white tracking-tight leading-none">Monday, July 15</h1>
          </div>
          
          <button 
            onClick={fetchDigest}
            disabled={isLoading}
            className="flex items-center gap-2 bg-transparent hover:bg-white/5 border border-[#333] px-4 py-2 rounded-full text-[13px] font-medium text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>

        <div className="h-px bg-[#222] w-full mb-8" />

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-20 bg-[#151515] rounded-xl border border-[#222]"></div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-white/10 rounded mb-6"></div>
                <div className="h-48 bg-[#111] rounded-xl border border-[#222]"></div>
                <div className="h-48 bg-[#111] rounded-xl border border-[#222]"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-32 bg-white/10 rounded mb-6"></div>
                <div className="h-32 bg-[#111] rounded-xl border border-[#222]"></div>
                <div className="h-32 bg-[#111] rounded-xl border border-[#222]"></div>
              </div>
            </div>
          </div>
        ) : data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Focus Suggestion */}
            <div className="bg-[#1a140a] border border-[#3a2a11] rounded-xl p-5 flex items-start gap-4">
              <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-[14px] text-zinc-400 leading-relaxed">
                <strong className="text-white font-semibold">Focus suggestion:</strong> {data.focusSuggestion}
              </div>
              <button className="border border-[#3a2a11] hover:bg-[#2b1f10] px-4 py-1.5 rounded-lg text-[12px] text-zinc-400 transition-colors">
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
              {/* Left Column */}
              <div className="space-y-10">
                
                {/* Today's Meetings */}
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-5">Today's Meetings</h3>
                  <div className="space-y-4">
                    {data.meetings.map(meeting => (
                      <div key={meeting.id} className="relative bg-[#111] border border-[#222] rounded-xl p-5 overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${meeting.color === 'cyan' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                        
                        <div className="flex justify-between items-start mb-5 pl-2">
                          <div>
                            <h4 className="text-[16px] font-bold text-white mb-1.5">{meeting.title}</h4>
                            <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">{meeting.time}</p>
                          </div>
                          <div className="flex items-center -space-x-1">
                            {meeting.attendees?.map((att, i) => (
                              <div key={i} className="w-[22px] h-[22px] rounded-full bg-[#222] border border-[#111] flex items-center justify-center text-[8px] font-bold text-zinc-300">
                                {att}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pl-2">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span className="text-[12px] font-medium text-zinc-400">AI Prep Notes</span>
                          </div>
                          <ul className="space-y-2.5">
                            {meeting.notes?.map((note, i) => (
                              <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-300">
                                <div className="w-1 h-1 rounded-full bg-zinc-600 mt-2 shrink-0" />
                                <span className="leading-relaxed">{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Action Items */}
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-5">Action Items</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.actionItems.map(item => (
                      <div key={item.id} className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col justify-between min-h-[140px]">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-[14px] font-medium text-white leading-snug">{item.text}</p>
                          <div className={`text-[8px] font-bold tracking-[0.15em] uppercase px-2 py-1 rounded shrink-0 mt-0.5 ${getActionBadgeStyle(item.type)}`}>
                            {item.type}
                          </div>
                        </div>
                        <p className="text-[12px] text-zinc-500 mt-6">From {item.from}</p>
                      </div>
                    ))}
                  </div>
                </section>

              </div>

              {/* Right Column */}
              <div className="space-y-10">
                
                {/* Waiting On */}
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-5">Waiting On</h3>
                  <div className="space-y-4">
                    {data.waitingOn.map(item => (
                      <div key={item.id} className="bg-[#111] border border-[#222] rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                          <div className="w-[22px] h-[22px] rounded-full bg-[#222] flex items-center justify-center text-[9px] font-bold text-zinc-300 shrink-0">
                            {item.initials}
                          </div>
                          <span className="text-[13px] font-semibold text-white">{item.name}</span>
                        </div>
                        <p className="text-[13px] text-zinc-400 leading-relaxed pl-11 mb-4">{item.text}</p>
                        <div className="pl-11 text-[9px] font-mono font-bold tracking-[0.2em] text-zinc-600 uppercase">
                          Sent {item.sent}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* FYI / Reading */}
                <section>
                  <h3 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-5">FYI / Reading</h3>
                  <div className="space-y-3">
                    {data.fyi.map(item => (
                      <div key={item.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-[13px] font-semibold text-white mb-0.5">{item.title}</h4>
                          <p className="text-[12px] text-zinc-500 line-clamp-1">{item.text}</p>
                        </div>
                        <div className="text-[9px] font-bold tracking-[0.15em] text-zinc-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded shrink-0">
                          FYI
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
