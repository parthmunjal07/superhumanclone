'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useInView } from 'react-intersection-observer';
import EmailItem from '@/components/EmailItem';
import ReadingPane from '@/components/ReadingPane';
import CalendarSidebar from '@/components/CalendarSidebar';
import ComposeModal from '@/components/ComposeModal';
import ShortcutOverlay from '@/components/ShortcutOverlay';
import { Search, SlidersHorizontal, RefreshCw, Edit } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InboxPage() {
  const limit = 20;
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ to: string; subject: string } | null>(null);
  const [view, setView] = useState<'INBOX' | 'ARCHIVED' | 'SENT' | 'SPAM'>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isShortcutOverlayOpen, setIsShortcutOverlayOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'NEWEST' | 'OLDEST' | 'UNREAD_FIRST'>('NEWEST');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
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
    if (pageIndex === 0) return `/api/emails?limit=${limit}&view=${view}`;
    return `/api/emails?cursor=${previousPageData.nextCursor}&limit=${limit}&view=${view}`;
  }, [debouncedSearchQuery, limit, view]);

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
  
  let displayEmails = [...emails];
  if (sortOption === 'OLDEST') {
    displayEmails.reverse();
  } else if (sortOption === 'UNREAD_FIRST') {
    displayEmails.sort((a: any, b: any) => {
      if (a.isRead === b.isRead) return new Date(b.date).getTime() - new Date(a.date).getTime();
      return a.isRead ? 1 : -1;
    });
  }

  const selectedEmail = emails.find((e: any) => e?.id === selectedEmailId) || null;

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
    return () => eventSource.close();
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      switch (e.key) {
        case 'c': e.preventDefault(); setReplyTo(null); setIsComposeOpen(true); break;
        case 'e': e.preventDefault(); if (selectedEmailId) handleArchive(selectedEmailId); break;
        case 'r': e.preventDefault(); if (selectedEmailId) handleReply(selectedEmailId); break;
        case '/': e.preventDefault(); setTimeout(() => searchInputRef.current?.focus(), 0); break;
        case '?': e.preventDefault(); setIsShortcutOverlayOpen(prev => !prev); break;
        case 'Escape': e.preventDefault(); setSelectedEmailId(null); break; // Close reading pane
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedEmailId, handleArchive, handleReply]);

  const tabs = [
    { id: 'INBOX', label: 'Inbox' },
    { id: 'ARCHIVED', label: 'Archived' },
    { id: 'SENT', label: 'Sent' },
    { id: 'SPAM', label: 'Spam' },
  ] as const;

  return (
    <div className="flex flex-1 overflow-hidden bg-white w-full h-full">
      {/* Pane 2: Email List (Main Content) */}
      <div className="flex-1 flex flex-col h-full relative border-r border-zinc-200">
        
        {/* Header (Top Nav) */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-zinc-200 shrink-0">
          <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">Inbox</h1>
          
          <div className="flex items-center gap-4">
            {/* Search Pill */}
            <div className="relative flex items-center w-[240px]">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search something..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white border border-zinc-200 rounded-full text-[13px] text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <div className="absolute right-3 flex items-center gap-0.5">
                <kbd className="font-sans text-[11px] font-medium text-zinc-400">⌘</kbd>
                <kbd className="font-sans text-[11px] font-medium text-zinc-400">S</kbd>
              </div>
            </div>

            {/* Filter / Refresh Icons */}
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className={`p-2 rounded-full border text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm ${isSortMenuOpen ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'border-zinc-200'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              
              {isSortMenuOpen && (
                <div className="absolute top-12 left-0 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 py-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sort By</div>
                  <button 
                    onClick={() => { setSortOption('NEWEST'); setIsSortMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-zinc-50 transition-colors ${sortOption === 'NEWEST' ? 'font-semibold text-blue-600' : 'text-zinc-700'}`}
                  >
                    Newest First
                  </button>
                  <button 
                    onClick={() => { setSortOption('OLDEST'); setIsSortMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-zinc-50 transition-colors ${sortOption === 'OLDEST' ? 'font-semibold text-blue-600' : 'text-zinc-700'}`}
                  >
                    Oldest First (Loaded)
                  </button>
                  <button 
                    onClick={() => { setSortOption('UNREAD_FIRST'); setIsSortMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-zinc-50 transition-colors ${sortOption === 'UNREAD_FIRST' ? 'font-semibold text-blue-600' : 'text-zinc-700'}`}
                  >
                    Unread First
                  </button>
                </div>
              )}

              <button 
                onClick={() => mutate()}
                className="p-2 rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
                title="Refresh Emails"
              >
                <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Compose Button */}
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-[14px] font-medium transition-colors shadow-sm ml-2"
            >
              <Edit className="w-4 h-4" />
              Compose
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center px-6 py-4 border-b border-zinc-100 shrink-0 overflow-x-auto no-scrollbar gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setView(tab.id);
                setSelectedEmailId(null);
              }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-wide transition-all shrink-0 ${
                view === tab.id
                  ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isEmpty ? (
            <div className="text-zinc-500 text-[14px] text-center mt-20">No emails found in this view.</div>
          ) : (
            displayEmails.map((email: any) => (
              <div key={email.id} onClick={() => setSelectedEmailId(email.id)}>
                <EmailItem
                  email={email}
                  isSelected={selectedEmailId === email.id}
                />
              </div>
            ))
          )}

          {/* Loading / End indicator */}
          <div ref={ref} className="py-8 text-center">
            {isLoadingMore ? (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            ) : isReachingEnd && !isEmpty ? (
              <p className="text-[11px] text-zinc-400 font-medium">No more emails</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pane 3: Right Sidebar Toggle (Reading Pane OR Calendar) */}
      {selectedEmailId && selectedEmail ? (
        <ReadingPane
          email={selectedEmail}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onReply={handleReply}
          onClose={() => setSelectedEmailId(null)}
        />
      ) : (
        <CalendarSidebar />
      )}

      {/* Modals */}
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
    </div>
  );
}
