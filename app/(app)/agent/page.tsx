'use client';

import { AgentChatUI } from '@/components/AgentChatUI';

export default function AgentPage() {
  return (
    <div className="flex-1 bg-[#F9FAFB] flex flex-col p-4 lg:p-8">
      <div className="flex-1 max-w-5xl mx-auto w-full rounded-[32px] overflow-hidden shadow-sm border border-zinc-200/60 bg-white">
        <AgentChatUI />
      </div>
    </div>
  );
}
