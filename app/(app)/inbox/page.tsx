'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useInView } from 'react-intersection-observer';
import EmailItem from '@/components/EmailItem';
import ReadingPane from '@/components/ReadingPane';
import ComposeModal from '@/components/ComposeModal';
import ShortcutOverlay from '@/components/ShortcutOverlay';
import { Edit, Search } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InboxPage() {
  const limit = 20;
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ to: string; subject: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isShortcutOverlayOpen, setIsShortcutOverlayOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getKey = useCallback((pageIndex: number, previousPageData: any) => {
    if (debouncedSearchQuery) {
      // If searching, we just hit the search endpoint (no pagination for simplicity)
      if (pageIndex > 0) return null; 
      return `/api/emails/search?q=${encodeURIComponent(debouncedSearchQuery)}`;
    }

    if (previousPageData && !previousPageData.nextCursor) return null;
    if (pageIndex === 0) return `/api/emails?limit=${limit}`;
    return `/api/emails?cursor=${previousPageData.nextCursor}&limit=${limit}`;
  }, [debouncedSearchQuery, limit]);

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const { ref, inView } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && !isValidating && !isReachingEnd && !debouncedSearchQuery) {
        setSize(size + 1);
      }
    },
  });

  const emails = data ? data.flatMap(page => page.emails || []) : [];
  const selectedEmail = emails.find(e => e?.id === selectedEmailId) || null;
  
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.emails?.length === 0;
  const isReachingEnd = debouncedSearchQuery ? true : isEmpty || (data && data[data.length - 1]?.emails?.length < limit) || (data && !data[data.length - 1]?.nextCursor);

  // SSE Realtime Updates
  useEffect(() => {
    if (debouncedSearchQuery) return; // Don't push SSE updates to search results view

    const eventSource = new EventSource('/api/sse');

    eventSource.onmessage = (event) => {
      try {
        const newEmail = JSON.parse(event.data);
        // Optimistically insert the new email at the top of the SWR cache
        mutate((currentData: any) => {
          if (!currentData) return currentData;
          // Prepend to the first page
          const newData = [...currentData];
          newData[0] = {
            ...newData[0],
            emails: [newEmail, ...newData[0].emails]
          };
          return newData;
        }, false);
      } catch (e) {
        console.error('Failed to parse SSE message', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [mutate, debouncedSearchQuery]);

  const removeEmailOptimistically = async (id: string, action: 'archive' | 'delete') => {
    if (selectedEmailId === id) setSelectedEmailId(null);
    
    await mutate((currentData: any) => {
      if (!currentData) return currentData;
      return currentData.map((page: any) => ({
        ...page,
        emails: page.emails.filter((e: any) => e.id !== id)
      }));
    }, false);

    try {
      const res = await fetch(`/api/emails/${id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to ${action}`);
    } catch (err) {
      console.error(`Rollback ${action}`, err);
      mutate();
    }
  };

  const handleArchive = useCallback((id: string) => removeEmailOptimistically(id, 'archive'), [selectedEmailId, mutate]);
  const handleDelete = useCallback((id: string) => removeEmailOptimistically(id, 'delete'), [selectedEmailId, mutate]);
  
  const handleReply = useCallback((id: string) => {
    const email = emails.find((e: any) => e.id === id);
    if (email) {
      setReplyTo({ to: email.from, subject: email.subject });
      setIsComposeOpen(true);
    }
  }, [emails]);

  const handleSend = async (payload: { to: string; subject: string; body: string }) => {
    await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }
      
      switch (e.key) {
        case 'c':
          e.preventDefault();
          setReplyTo(null);
          setIsComposeOpen(true);
          break;
        case 'e':
          e.preventDefault();
          if (selectedEmailId) handleArchive(selectedEmailId);
          break;
        case 'r':
          e.preventDefault();
          if (selectedEmailId) handleReply(selectedEmailId);
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case '?':
          e.preventDefault();
          setIsShortcutOverlayOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedEmailId, handleArchive, handleReply]);

  return (
    <>
      {/* Pane 2: List View */}
      <div className="w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden">
        <div className="h-24 flex flex-col justify-center px-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Inbox</h2>
            <button 
              onClick={() => { setReplyTo(null); setIsComposeOpen(true); }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              title="Compose (C)"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search (AI Vector Search)..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-zinc-700 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative scroll-smooth">
          {isEmpty ? (
            <div className="text-zinc-500 text-sm text-center mt-10">No emails found.</div>
          ) : (
            emails.map((email: any) => (
              <div key={email.id} onClick={() => setSelectedEmailId(email.id)}>
                <EmailItem 
                  email={email} 
                />
              </div>
            ))
          )}

          {/* Loading / End indicator & Observer Target */}
          <div ref={ref} className="py-4 text-center">
            {isLoadingMore ? (
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
            ) : isReachingEnd && !isEmpty ? (
              <p className="text-xs text-zinc-600 font-medium tracking-widest uppercase mt-4">End of Inbox</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pane 3: Detail View */}
      <ReadingPane 
        email={selectedEmail} 
        onArchive={handleArchive}
        onDelete={handleDelete}
        onReply={handleReply}
      />

      {isComposeOpen && (
        <ComposeModal 
          onClose={() => setIsComposeOpen(false)} 
          onSend={handleSend}
          replyTo={replyTo}
        />
      )}

      {isShortcutOverlayOpen && (
        <ShortcutOverlay onClose={() => setIsShortcutOverlayOpen(false)} />
      )}
    </>
  );
}
