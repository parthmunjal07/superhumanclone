'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useInView } from 'react-intersection-observer';
import EmailItem from '@/components/EmailItem';
import ReadingPane from '@/components/ReadingPane';
import ComposeModal from '@/components/ComposeModal';
import ShortcutOverlay from '@/components/ShortcutOverlay';
import { Edit, Search, SlidersHorizontal } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InboxPage() {
  const limit = 20;
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [listWidth, setListWidth] = useState(300);
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
    if (debouncedSearchQuery) return;

    const eventSource = new EventSource('/api/sse');

    eventSource.onmessage = (event) => {
      try {
        const newEmail = JSON.parse(event.data);
        mutate((currentData: any) => {
          if (!currentData) return currentData;
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
      {/* Pane 2: Email List */}
      <div 
        style={{ width: selectedEmailId ? listWidth : undefined }}
        className={`${selectedEmailId ? 'border-r border-[#2a2a2a] shrink-0' : 'flex-1'} bg-[#151515] flex flex-col h-full overflow-hidden relative`}
      >
        {/* Resize Handle */}
        {selectedEmailId && (
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-zinc-500/50 z-50 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = listWidth;
              const onMouseMove = (moveEvent: MouseEvent) => {
                setListWidth(Math.max(250, Math.min(800, startWidth + (moveEvent.clientX - startX))));
              };
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.style.cursor = 'default';
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
              document.body.style.cursor = 'col-resize';
            }}
          />
        )}
        {/* List Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[#2a2a2a] shrink-0">
          <h2 className="text-[15px] font-semibold text-white">Inbox</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
              title="Search (/)"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-zinc-500 hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
              title="Filter"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (hidden by default, could be toggled) */}
        {searchQuery !== '' && (
          <div className="px-3 py-2 border-b border-[#2a2a2a]">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search emails..."
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-md py-1.5 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {/* Hidden input for focus target */}
        <input
          ref={searchInputRef}
          type="text"
          className="sr-only"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchQuery(searchQuery || '')}
        />

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="text-zinc-600 text-sm text-center mt-16">No emails found.</div>
          ) : (
            emails.map((email: any) => (
              <div key={email.id} onClick={() => setSelectedEmailId(email.id)}>
                <EmailItem
                  email={email}
                  isSelected={selectedEmailId === email.id}
                />
              </div>
            ))
          )}

          {/* Loading / End indicator */}
          <div ref={ref} className="py-4 text-center">
            {isLoadingMore ? (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-zinc-700 border-t-zinc-400"></div>
            ) : isReachingEnd && !isEmpty ? (
              <p className="text-[10px] text-zinc-700 font-mono font-medium tracking-widest uppercase mt-2">End of Inbox</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pane 3: Reading Pane */}
      {selectedEmail && (
        <ReadingPane
          email={selectedEmail}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      )}

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
