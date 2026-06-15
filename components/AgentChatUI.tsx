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
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    initialMessages: [], 
  });

  const isLoading = status === 'submitted' || status === 'streaming' || status === 'generating';

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
    sendMessage({ text: input });
    setInput('');
  };

  // Keyboard shortcuts (ctrl+v/k) were intentionally removed per user request to avoid conflicts.

  return (
    <div className={`flex flex-col bg-white overflow-hidden font-sans ${isDocked ? 'h-[600px] w-[500px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200/60' : 'h-full w-full'}`}>

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#CBE4FF] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#1E4C82]" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-zinc-900 leading-tight">Corsair Agent</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold tracking-widest text-emerald-600 uppercase">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDocked && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-[11px] font-bold tracking-widest text-zinc-600 uppercase transition-colors">
              <Maximize2 className="w-3 h-3" /> Expand
            </button>
          )}
          {isDocked && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
            <Bot className="w-12 h-12 text-zinc-200" />
            <p className="text-sm font-medium">How can I help you today?</p>
          </div>
        )}

        {messages.map((m: any) => (
          <div key={m.id} className="flex gap-4 max-w-full">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-zinc-200' : 'bg-[#CBE4FF]'}`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-zinc-600" /> : <Bot className="w-4 h-4 text-[#1E4C82]" />}
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {m.role === 'user' ? 'You' : 'Agent'}
              </div>
              
              {m.content && m.content.length > 0 && (
                <div className={`rounded-2xl p-4 text-[14px] leading-relaxed break-words shadow-sm ${m.role === 'user' ? 'bg-white border border-zinc-200 text-zinc-900' : 'bg-[#CBE4FF] border border-[#B4D7FF] text-[#1E4C82]'}`}>
                  {m.content}
                </div>
              )}

              {(!m.content || m.content.length === 0) && m.parts && m.parts.map((p: any, i: number) => {
                if (p.type === 'text' && p.text) {
                  return (
                    <div key={i} className={`rounded-2xl p-4 text-[14px] leading-relaxed break-words shadow-sm mt-2 ${m.role === 'user' ? 'bg-white border border-zinc-200 text-zinc-900' : 'bg-[#CBE4FF] border border-[#B4D7FF] text-[#1E4C82]'}`}>
                      {p.text}
                    </div>
                  );
                }
                return null;
              })}

              {/* MCP Action Log parsed from stream */}
              {(() => {
                const tools = m.toolInvocations || (m.parts ? m.parts.filter((p: any) => p.type === 'tool-invocation' || p.type === 'dynamic-tool' || p.type === 'tool') : []);
                if (tools.length > 0) {
                  return <ActionLog toolInvocations={tools} />;
                }
                return null;
              })()}
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#CBE4FF] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#1E4C82]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-end gap-1 h-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1 bg-[#1E4C82] rounded-full h-full animate-pulse opacity-60" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-5 border-t border-zinc-100 bg-white shrink-0">
        {voiceState === 'listening' && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="px-3 py-1.5 rounded-full bg-blue-50 flex items-center gap-2 border border-blue-100">
              <Waveform active={true} />
              <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Listening</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl p-2 focus-within:border-zinc-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          <div className="pl-3 pr-2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer shrink-0">
            <Paperclip className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Agent anything..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-zinc-900 px-2 placeholder:text-zinc-400 min-w-0"
          />
          <div className="flex items-center gap-2 pr-1 shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${voiceState === 'listening' ? 'bg-[#FECDD3] text-[#881337] hover:bg-[#FDA4AF]' : 'bg-transparent text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button type="submit" disabled={!input || input.trim() === ''} className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              <ArrowUp className="w-5 h-5" />
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
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mt-3 shadow-sm">
      <button
        onClick={() => setLogOpen(!logOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
          {logOpen ? <ChevronDown className="w-4 h-4 text-[#1E4C82]" /> : <ChevronRight className="w-4 h-4 text-[#1E4C82]" />}
          <span className="text-[#1E4C82]">Action Log</span>
          <span className="text-zinc-400">· {toolInvocations.length} calls</span>
        </div>
      </button>
      {logOpen && (
        <div className="p-4 space-y-4 border-t border-zinc-100 bg-white">
          {toolInvocations.map((tool, idx) => {
            const state = tool.state === 'output-available' || tool.state === 'result' ? 'result' : tool.state || 'running';
            const inputStr = JSON.stringify(tool.args || tool.input, null, 2);
            const outputStr = state === 'result' ? JSON.stringify(tool.result || tool.output, null, 2) : 'running...';
            return (
              <ToolCallItem
                key={tool.toolCallId || idx}
                name={tool.toolName}
                state={state}
                input={inputStr}
                output={outputStr}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToolCallItem({ name, state, input, output }: { name: string, state: string, input: string, output: string }) {
  return (
    <div className="text-[12px] font-mono">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${state === 'result' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
        <span className={`${state === 'result' ? 'text-emerald-600' : 'text-amber-600'} font-bold uppercase tracking-widest`}>Tool Call</span>
        <span className="text-zinc-500 font-semibold">{name}</span>
      </div>
      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 ml-4 space-y-3 overflow-x-auto">
        <div><span className="text-amber-600 font-bold">Input:</span> <span className="text-zinc-700 whitespace-pre-wrap">{input}</span></div>
        <div><span className="text-emerald-600 font-bold">Output:</span> <span className="text-zinc-700 whitespace-pre-wrap">{output}</span></div>
      </div>
    </div>
  );
}
