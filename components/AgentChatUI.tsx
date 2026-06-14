'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat as useChatOriginal } from '@ai-sdk/react';
const useChat = useChatOriginal as any;
import {
  Bot, Maximize2, X, User, Paperclip, ArrowUp, Mic, ChevronDown, ChevronRight
} from 'lucide-react';
import { Waveform } from '@/components/Waveform';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export function AgentChatUI({ onClose, isDocked = false }: { onClose?: () => void, isDocked?: boolean }) {
  const { state: voiceState, toggleListening, transcript } = useVoiceInput();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  
  const { messages, append, status } = useChat({
    api: '/api/chat',
    initialMessages: [], // Strict React state, no localStorage
  });

  const isLoading = status === 'submitted' || status === 'streaming' || status === 'generating';

  // Sync voice transcript to input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input || !input.trim()) return;
    append({ role: 'user', content: input });
    setInput('');
  };

  // Global shortcut ⌘K to focus input, ⌘V to toggle voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

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
              <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">Active · MCP Enabled</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            How can I help you today?
          </div>
        )}

        {messages.map((m: any) => (
          <div key={m.id} className="flex gap-4">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-blue-600/10 border border-blue-500/20'}`}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5 text-zinc-500" /> : <Bot className="w-3.5 h-3.5 text-blue-500" />}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                {m.role === 'user' ? 'You' : 'Agent'}
              </div>
              
              {m.content && (
                <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4 text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              )}

              {/* MCP Action Log parsed from stream */}
              {m.toolInvocations && m.toolInvocations.length > 0 && (
                <ActionLog toolInvocations={m.toolInvocations} />
              )}
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-end gap-0.5 h-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-0.5 bg-blue-500 rounded-full h-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider">streaming...</span>
              </div>
            </div>
          </div>
        )}
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

        <form onSubmit={handleSubmit} className="flex items-center bg-[#111] border border-[#222] rounded-xl p-1.5 focus-within:border-[#444] transition-colors">
          <div className="pl-3 pr-2 text-zinc-500 cursor-pointer hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Agent anything... (⌘K to focus)"
            className="flex-1 bg-transparent border-none focus:outline-none text-[13px] text-white px-2 placeholder:text-zinc-600"
          />
          <div className="flex items-center gap-1.5 pr-1">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${voiceState === 'listening' ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-[#1a1a1a] border-[#222] text-zinc-400 hover:text-white'}`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button type="submit" disabled={!input || input.trim() === ''} className="w-8 h-8 rounded-lg bg-[#e0e0e0] text-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionLog({ toolInvocations }: { toolInvocations: any[] }) {
  const [logOpen, setLogOpen] = useState(false);
  
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden mt-3">
      <button
        onClick={() => setLogOpen(!logOpen)}
        className="w-full flex items-center justify-between p-3 bg-[#151515] hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase">
          {logOpen ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3 text-blue-500" />}
          <span className="text-blue-500">MCP Action Log</span>
          <span className="text-zinc-600">· {toolInvocations.length} calls</span>
        </div>
      </button>
      {logOpen && (
        <div className="p-4 space-y-4 border-t border-[#222]">
          {toolInvocations.map((tool, idx) => (
            <ToolCallItem
              key={tool.toolCallId || idx}
              name={tool.toolName}
              state={tool.state}
              input={JSON.stringify(tool.args, null, 2)}
              output={tool.state === 'result' ? JSON.stringify(tool.result, null, 2) : 'running...'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCallItem({ name, state, input, output }: { name: string, state: string, input: string, output: string }) {
  return (
    <div className="text-[11px] font-mono">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${state === 'result' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
        <span className={`${state === 'result' ? 'text-emerald-400' : 'text-amber-400'} font-bold uppercase tracking-widest`}>Tool Call</span>
        <span className="text-zinc-300">{name}</span>
      </div>
      <div className="bg-[#151515] border border-[#222] rounded p-3 ml-3 space-y-2 overflow-x-auto">
        <div><span className="text-amber-500">input:</span> <span className="text-zinc-300 whitespace-pre-wrap">{input}</span></div>
        <div><span className="text-emerald-400">output:</span> <span className="text-zinc-300 whitespace-pre-wrap">{output}</span></div>
      </div>
    </div>
  );
}
