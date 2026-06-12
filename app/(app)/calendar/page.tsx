'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Calendar as CalendarIcon, Clock, MapPin, Info } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CalendarPage() {
  const { data, error, isLoading } = useSWR('/api/calendar?limit=50', fetcher);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = data?.events || [];
  
  // Group events by date
  const groupedEvents = events.reduce((acc: any, event: any) => {
    // some events might be all-day (just 'date' instead of 'dateTime')
    const dateStr = format(new Date(event.start), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {});

  const dates = Object.keys(groupedEvents).sort();
  
  // Auto-select first event if none selected
  const displayEventId = selectedEventId || (events.length > 0 ? events[0].id : null);
  const selectedEvent = events.find((e: any) => e.id === displayEventId);

  const formatHeader = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEEE, MMMM d');
  };

  const formatEventTime = (dateString: string) => {
    if (!dateString) return '';
    // if it's an all-day event it won't have time, just date
    if (dateString.length === 10) return 'All Day'; 
    return format(new Date(dateString), 'h:mm a');
  };

  return (
    <>
      <div className="w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden shrink-0">
        <div className="h-24 flex flex-col justify-center px-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">Upcoming Events</h2>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 relative scroll-smooth">
          {isLoading && (
            <div className="flex justify-center mt-10">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-sm text-center mt-10">Failed to load calendar.</div>
          )}

          {!isLoading && !error && dates.length === 0 && (
            <div className="text-zinc-500 text-sm text-center mt-10">No upcoming events.</div>
          )}

          {dates.map((dateStr) => (
            <div key={dateStr}>
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">
                {formatHeader(dateStr)}
              </h3>
              <div className="space-y-1">
                {groupedEvents[dateStr].map((event: any) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 border flex items-start space-x-3 group
                      ${displayEventId === event.id 
                        ? 'bg-zinc-800/80 border-zinc-700 shadow-sm' 
                        : 'border-transparent hover:bg-zinc-900 hover:border-zinc-800'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors duration-300 ${displayEventId === event.id ? 'bg-indigo-400' : 'bg-indigo-500/50 group-hover:bg-indigo-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-sm font-medium truncate pr-2 ${displayEventId === event.id ? 'text-white' : 'text-zinc-200'}`}>
                          {event.title}
                        </span>
                        <span className={`text-[11px] shrink-0 tabular-nums ${displayEventId === event.id ? 'text-indigo-300' : 'text-zinc-500'}`}>
                          {formatEventTime(event.start)}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 truncate flex items-center">
                        {event.location ? (
                          <><MapPin className="h-3 w-3 inline mr-1 opacity-70" /> {event.location.split(',')[0]}</>
                        ) : (
                          event.description ? 'Description attached' : 'No location'
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pane 3: Detail View */}
      <div className="flex-1 bg-black overflow-y-auto relative">
        {selectedEvent ? (
          <div className="max-w-3xl mx-auto p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-8 tracking-tight leading-tight">
              {selectedEvent.title}
            </h1>
            
            <div className="space-y-4">
              <div className="flex items-center text-zinc-300 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/60">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center mr-5 shrink-0">
                  <Clock className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-white mb-0.5">
                    {format(new Date(selectedEvent.start), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {formatEventTime(selectedEvent.start)} {selectedEvent.end && selectedEvent.start !== selectedEvent.end && `- ${formatEventTime(selectedEvent.end)}`}
                  </div>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center text-zinc-300 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/60">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center mr-5 shrink-0">
                    <MapPin className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white mb-0.5">Location</div>
                    <div className="text-sm text-zinc-400 break-words">
                      {selectedEvent.location.includes('http') ? (
                        <a href={selectedEvent.location} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors hover:underline">
                          {selectedEvent.location}
                        </a>
                      ) : (
                        selectedEvent.location
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="flex items-start text-zinc-300 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/60">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center mr-5 shrink-0 mt-1">
                    <Info className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white mb-2 mt-1.5">Description</div>
                    <div className="text-sm text-zinc-400 prose prose-invert prose-p:leading-relaxed max-w-none break-words" dangerouslySetInnerHTML={{ __html: selectedEvent.description }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <div className="text-center">
              <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CalendarIcon className="h-8 w-8 text-zinc-700" />
              </div>
              <p className="text-zinc-500">Select an event to view details</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
