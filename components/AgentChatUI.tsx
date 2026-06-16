'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart } from 'ai';
import {
  Maximize2, X, User, ArrowUp, Mic, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import { Waveform } from '@/components/Waveform';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export function AgentChatUI({ onClose, isDocked = false }: { onClose?: () => void, isDocked?: boolean }) {
  // 1. Voice Input Hooks
  const { state: voiceState, toggleListening, stopListening, transcript, setTranscript } = useVoiceInput();
  
  // 2. Local State for Input Management (needed for Voice + Typing merging)
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [baseInput, setBaseInput] = useState('');
  
  // 3. Vercel AI SDK Hook
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // --- VOICE INPUT MERGING LOGIC ---
  useEffect(() => {
    if (voiceState === 'listening') {
      setBaseInput(input);
    }
  }, [voiceState]);

  useEffect(() => {
    if (voiceState === 'listening' && transcript) {
      setInput((baseInput + ' ' + transcript).trim());
    }
  }, [transcript, voiceState, baseInput]);

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input || !input.trim()) return;
    
    // Send the message to the backend
    sendMessage({ text: input });
    
    // Reset all inputs
    setInput('');
    setBaseInput('');
    setTranscript('');
    stopListening();
  };

  // Log any silent API errors to the console
  useEffect(() => {
    if (error) console.error("Chat API Error:", error);
  }, [error]);

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${isDocked ? 'h-[600px] w-[500px] rounded-xl shadow-2xl border border-zinc-200/50' : 'h-full w-full'}`}>

      {/* Header - Minimalist Swiss */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-white/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold tracking-tight text-zinc-900 leading-none">Superhuman AI</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDocked && (
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors uppercase">
              <Maximize2 className="w-3 h-3" /> Expand
            </button>
          )}
          {isDocked && (
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 bg-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
             <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6 text-zinc-300" />
             </div>
             <p className="text-[13px] font-medium tracking-tight">How can I help you today?</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="flex gap-4 group">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
              {m.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Sparkles className="w-4 h-4 text-zinc-900" />}
            </div>
            
            <div className="flex-1 space-y-3 min-w-0">
              <div className="text-[11px] font-medium text-zinc-400 tracking-tight">
                {m.role === 'user' ? 'You' : 'Superhuman AI'}
              </div>
              
              {/* Render Tool Invocations (MCP Actions) - Sleek Inline Chips */}
              {m.parts && m.parts.filter(isToolUIPart).length > 0 && (
                <div className="flex flex-col gap-2">
                  {m.parts.filter(isToolUIPart).map((tool, idx) => (
                    <ToolActionChip key={tool.toolCallId || idx} tool={tool} />
                  ))}
                </div>
              )}


              {/* Render Text Content (Natural Language) */}
              {m.parts ? m.parts.filter((p: any) => p.type === 'text').map((p: any, i: number) => (
                <div key={i} className="text-[14px] leading-[1.6] tracking-tight text-zinc-800 whitespace-pre-wrap break-words">
                  {p.text}
                </div>
              )) : (
                (m as any).content && (m as any).content.length > 0 && (
                  <div className="text-[14px] leading-[1.6] tracking-tight text-zinc-800 whitespace-pre-wrap break-words">
                    {(m as any).content}
                  </div>
                )
              )}

            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && status === 'submitted' && (
           <div className="flex gap-4">
             <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
               <Sparkles className="w-4 h-4 text-zinc-900" />
             </div>
             <div className="flex-1 flex items-center gap-2 pt-1">
               <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
               <span className="text-[13px] tracking-tight text-zinc-500">Thinking...</span>
             </div>
           </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-zinc-100 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
           {voiceState === 'listening' && (
             <div className="absolute -top-12 left-0 right-0 flex justify-center">
               <div className="px-3 py-1.5 rounded-full bg-zinc-900 text-white shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                 <Waveform active={true} />
                 <span className="text-[11px] font-medium tracking-tight">Listening...</span>
               </div>
             </div>
           )}

           <div className={`flex items-center rounded-xl p-1 transition-all duration-200 ${voiceState === 'listening' ? 'bg-zinc-50 border border-zinc-200 shadow-sm' : 'bg-zinc-50/50 border border-zinc-200/50 hover:bg-zinc-50 focus-within:bg-zinc-50 focus-within:border-zinc-300 focus-within:shadow-sm'}`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask Superhuman AI..."
                className="flex-1 bg-transparent border-none focus:outline-none text-[14px] tracking-tight text-zinc-900 px-3 placeholder:text-zinc-400 h-10"
              />
              <div className="flex items-center gap-1 pr-1">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${voiceState === 'listening' ? 'bg-rose-100 text-rose-600' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50'}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  type="submit" 
                  disabled={!input || input.trim() === '' || isLoading} 
                  className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:hover:bg-zinc-900 shadow-sm"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
           </div>
        </form>
      </div>
    </div>
  );
}

// Minimalist Tool Action Chip (Replaces JSON ActionLog)
function ToolActionChip({ tool }: { tool: any }) {
  const isComplete = tool.state === 'result' || tool.state === 'output-available';
  // SAFTEY CHECK: Fallback to tool.name or a generic string if toolName is temporarily undefined during the stream
  const rawName = tool.toolName || tool.name || 'Processing Tool';
  const actionName = formatActionName(rawName);

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-50 border border-zinc-200/60 w-fit shadow-sm">
      {isComplete ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
      )}
      <span className="text-[12px] font-medium tracking-tight text-zinc-600">
        {isComplete ? `Completed: ${actionName}` : `Running: ${actionName}...`}
      </span>
    </div>
  );
}

// Helper to format raw tool names into human readable actions
function formatActionName(name?: string): string {
  // SAFETY CHECK: If name is still somehow missing, return a safe fallback
  if (!name) return 'Tool Execution';
  
  switch (name) {
    case 'get_calendar_events': return 'Fetch Calendar';
    case 'send_email': return 'Send Email';
    case 'create_event': return 'Create Event';
    default: return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
