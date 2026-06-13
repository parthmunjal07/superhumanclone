'use client';

import { useState } from 'react';
import {
  Bot, Code, Maximize2, X, User, ExternalLink, Reply,
  Send, Edit3, Paperclip, ArrowUp, Mic, ChevronDown,
  CheckCircle2, ChevronRight
} from 'lucide-react';
import { Waveform } from '@/components/Waveform';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export function AgentChatUI({ onClose, isDocked = false }: { onClose?: () => void, isDocked?: boolean }) {
  const { state: voiceState, toggleListening } = useVoiceInput();
  const [logOpen, setLogOpen] = useState(true);

  return (
    <div className={`flex flex-col bg-[#0a0a0a] shadow-2xl overflow-hidden ${isDocked ? 'h-[600px] w-[500px] rounded-t-xl sm:rounded-xl border border-[#222]' : 'h-full w-full'}`}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-white leading-tight">Agent</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">Active · GPT-4o + MCP</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#111] border border-[#222] hover:bg-[#1a1a1a] text-[9px] font-mono tracking-widest text-zinc-400 uppercase transition-colors">
            <Code className="w-3 h-3" /> Logs
          </button>
          {!isDocked && (
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#111] border border-[#222] hover:bg-[#1a1a1a] text-[9px] font-mono tracking-widest text-zinc-400 uppercase transition-colors">
              <Maximize2 className="w-3 h-3" /> Expand
            </button>
          )}
          {isDocked && (
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#111] text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* User Message 1 */}
        <div className="flex gap-4">
          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">You · 09:41:02</div>
            <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4 text-[13px] text-zinc-200 leading-relaxed">
              Summarize my unread emails and check if I have any scheduling conflicts this week. Also create a Linear issue for the Q3 roadmap feedback from Elena.
            </div>
          </div>
        </div>

        {/* Agent Message 1 */}
        <div className="flex gap-4">
          <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Agent · 09:41:08</div>

            <div className="space-y-3">
              {/* Summary Box */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <p className="text-[13px] text-white mb-4">I found 3 unread emails in your inbox. Here's a quick summary:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-[13px]">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Elena (Urgent): </span>
                      <span className="text-zinc-400">Q3 roadmap sign-off needed — wants confirmation on launch date and budget.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-[13px]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Marcus (Normal): </span>
                      <span className="text-zinc-400">Design review scheduled for Thursday 2pm.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-[13px]">
                    <div className="w-2 h-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Notion (FYI): </span>
                      <span className="text-zinc-400">Weekly digest ready.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Conflict Box */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <p className="text-[13px] text-white mb-2">Checking your calendar for conflicts this week...</p>
                <div className="flex items-center gap-2 text-[12px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No conflicts found. Thursday 2pm design review is clear.
                </div>
              </div>

              {/* MCP Action Log */}
              <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                <button
                  onClick={() => setLogOpen(!logOpen)}
                  className="w-full flex items-center justify-between p-3 bg-[#151515] hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase">
                    {logOpen ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3 text-blue-500" />}
                    <span className="text-blue-500">MCP Action Log</span>
                    <span className="text-zinc-600">· 4 calls · 1.2s</span>
                  </div>
                </button>
                {logOpen && (
                  <div className="p-4 space-y-4 border-t border-[#222]">
                    <ToolCallItem name="gmail.listUnread" time="0.3s" input='{maxResults: 10, labelIds: ["UNREAD"]}' output="3 messages returned" />
                    <ToolCallItem name="tavily.search" time="0.4s" input='{query: "Q3 roadmap context Elena"}' output="2 relevant docs found" />
                    <ToolCallItem name="calendar.getEvents" time="0.2s" input='{timeMin: "2024-07-15", timeMax: "2024-07-19"}' output="5 events, 0 conflicts" />
                    <ToolCallItem name="linear.createIssue" time="0.3s" input='{title: "Q3 Roadmap Feedback", priority: "urgent", assignee: "marcus"}' output="Issue ORB-412 created ✓" />
                  </div>
                )}
              </div>

              {/* Done Box */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <p className="text-[13px] text-white leading-relaxed mb-4">
                  Done! I've created Linear issue <span className="text-blue-400 cursor-pointer hover:underline">ORB-412</span> for Elena's Q3 roadmap feedback, marked as <span className="text-red-400">urgent</span>. No calendar conflicts this week — you're clear.
                </p>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] rounded-lg text-[11px] text-zinc-300 transition-colors">
                    <ExternalLink className="w-3 h-3" /> View ORB-412
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] rounded-lg text-[11px] text-zinc-300 transition-colors">
                    <Reply className="w-3 h-3" /> Reply to Elena
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Message 2 */}
        <div className="flex gap-4">
          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">You · 09:42:15</div>
            <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4 text-[13px] text-zinc-200 leading-relaxed">
              Draft a reply to Elena confirming the launch date as Aug 15th and that budget is approved.
            </div>
          </div>
        </div>

        {/* Agent Message 2 */}
        <div className="flex gap-4">
          <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Agent · 09:42:19</div>

            <div className="bg-[#111] border border-[#222] rounded-xl p-4">
              <p className="text-[13px] text-white mb-4">Here's a draft reply for Elena:</p>

              {/* Draft Block */}
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 mb-4">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                  Draft · To: elena@orbit.io
                </div>
                <div className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  Hey Elena,

                  Confirming that we're locked in for August 15th as the launch date. Budget has been approved — we're good to go.

                  Let me know if you need anything else before then.

                  Best,
                  Marcus
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-[12px] font-medium transition-colors">
                  <Send className="w-3.5 h-3.5" /> Send Reply
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] rounded-lg text-[12px] font-medium text-zinc-300 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Draft
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-end gap-0.5 h-2">
                {[1, 2, 3].map(i => <div key={i} className="w-0.5 bg-blue-500 rounded-full h-full" />)}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 tracking-wider">streaming complete</span>
            </div>
          </div>
        </div>

      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#222] bg-[#0a0a0a] shrink-0">
        {voiceState === 'listening' && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <Waveform active={true} />
              <span className="text-[9px] font-mono tracking-widest text-blue-400 uppercase">Listening</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Web Speech API active</span>
          </div>
        )}

        <div className="flex items-center bg-[#111] border border-[#222] rounded-xl p-1.5 focus-within:border-[#444] transition-colors">
          <div className="pl-3 pr-2 text-zinc-500 cursor-pointer hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Ask Agent anything... search emails, draft replies, create tasks"
            className="flex-1 bg-transparent border-none focus:outline-none text-[13px] text-white px-2 placeholder:text-zinc-600"
          />
          <div className="flex items-center gap-1.5 pr-1">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1a1a1a] border border-[#222] text-[10px] font-mono text-zinc-500 cursor-pointer hover:bg-[#222] transition-colors">
              <span className="bg-[#222] px-1 rounded text-zinc-400">⌘V</span> paste
            </div>
            <button className="w-8 h-8 rounded-lg bg-[#e0e0e0] text-black flex items-center justify-center hover:bg-white transition-colors">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={toggleListening}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${voiceState === 'listening' ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-[#1a1a1a] border-[#222] text-zinc-400 hover:text-white'}`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCallItem({ name, time, input, output }: { name: string, time: string, input: string, output: string }) {
  return (
    <div className="text-[11px] font-mono">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-emerald-400 font-bold uppercase tracking-widest">Tool Call</span>
        <span className="text-zinc-300">{name}</span>
        <span className="text-zinc-600">· {time}</span>
      </div>
      <div className="bg-[#151515] border border-[#222] rounded p-3 ml-3 space-y-2">
        <div><span className="text-amber-500">input:</span> <span className="text-zinc-300">{input}</span></div>
        <div><span className="text-emerald-400">output:</span> <span className="text-zinc-300">{output}</span></div>
      </div>
    </div>
  );
}
