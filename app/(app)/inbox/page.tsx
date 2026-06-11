'use client';

import { useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useInView } from 'react-intersection-observer';
import EmailItem from '@/components/EmailItem';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InboxPage() {
  const limit = 20;

  const getKey = (pageIndex: number, previousPageData: any) => {
    // reached the end
    if (previousPageData && !previousPageData.nextCursor) return null;

    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return `/api/emails?limit=${limit}`;

    // add the cursor to the API endpoint
    return `/api/emails?cursor=${previousPageData.nextCursor}&limit=${limit}`;
  };

  const { data, error, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false, // For testing, less noisy
  });

  const { ref, inView } = useInView({
    threshold: 0,
    onChange: (inView) => {
      // Trigger fetch when user scrolls to bottom
      if (inView && !isValidating && !isReachingEnd) {
        setSize(size + 1);
      }
    },
  });

  const emails = data ? data.flatMap(page => page.emails) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.emails?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.emails?.length < limit) || (data && !data[data.length - 1]?.nextCursor);

  return (
    <>
      {/* Pane 2: List View */}
      <div className="w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden">
        <div className="h-16 flex items-center px-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold text-white">Inbox</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative scroll-smooth">
          {isEmpty ? (
            <div className="text-zinc-500 text-sm text-center mt-10">No emails found.</div>
          ) : (
            emails.map((email: any) => (
              <EmailItem key={email.id} email={email} />
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

      {/* Pane 3: Detail View Stub */}
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-zinc-500">
        <p>Select an email to view</p>
      </div>
    </>
  );
}
