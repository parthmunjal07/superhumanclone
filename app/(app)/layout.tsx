import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { AgentDockWrapper } from '@/components/AgentDockWrapper';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-[#111] text-white">
        {/* Pane 1: Sidebar */}
        <Sidebar />
        
        {/* Panes 2 & 3: Main Application Area */}
        <div className="flex flex-1 flex-row overflow-hidden relative">
          {children}
          <AgentDockWrapper />
        </div>
      </div>
    </ProtectedRoute>
  );
}
