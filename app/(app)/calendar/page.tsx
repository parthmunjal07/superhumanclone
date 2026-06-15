'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import CreateEventModal from '@/components/CreateEventModal';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  addWeeks,
  isSameDay,
  isToday,
  addMinutes,
  differenceInMinutes,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subDays,
  subMonths,
  addMonths
} from 'date-fns';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[Calendar Fetcher] API error:', res.status, body);
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CALENDAR_START_HOUR = 0;

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  // Update "now" every minute for the timeline
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const editEventId = searchParams.get('editEventId');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  const fetchStart = view === 'day' ? dayStart : view === 'week' ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const fetchEnd = view === 'day' ? dayEnd : view === 'week' ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/calendar?timeMin=${fetchStart.toISOString()}&timeMax=${fetchEnd.toISOString()}`,
    fetcher
  );

  const events = data?.events || [];

  const days = useMemo(() => {
    if (view === 'day') return [currentDate];
    if (view === 'week') {
      const d = [];
      for (let i = 0; i < 7; i++) {
        d.push(addDays(weekStart, i));
      }
      return d;
    }
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [view, currentDate, weekStart, monthStart, monthEnd]);

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Handlers
  const handleGridClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = addMinutes(start, 30);
    
    setSelectedEvent({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent({
      id: event.id,
      title: event.title || event.summary || '',
      start: event.start?.dateTime || event.start?.date || event.start || '',
      end: event.end?.dateTime || event.end?.date || event.end || '',
      description: event.description || '',
      attendees: event.attendees ? event.attendees.map((a: any) => a.email) : [],
      hangoutLink: event.hangoutLink || null
    });
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    if (editEventId && events.length > 0) {
      const ev = events.find((e: any) => e.id === editEventId);
      if (ev) {
        handleEventClick(ev);
        router.replace('/calendar', { scroll: false });
      }
    }
  }, [editEventId, events, router]);

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (payload: { title: string; start: string; end: string; description: string; attendees: string[] }) => {
    const isEdit = !!selectedEvent?.id;
    const res = await fetch(isEdit ? '/api/calendar' : '/api/calendar/events', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        ...(isEdit ? { eventId: selectedEvent.id } : {})
      })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save event');
    }
    mutate();
  };

  const handleDeleteEvent = async (eventId: string) => {
    const res = await fetch(`/api/calendar?eventId=${eventId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete event');
    }
    mutate();
  };

  const GOOGLE_COLORS: Record<string, { bg: string, text: string, border: string }> = {
    '1': { bg: 'bg-[#CBE4FF]', border: 'border-[#B4D7FF]', text: 'text-[#1E4C82]' }, 
    '2': { bg: 'bg-[#BCF0C8]', border: 'border-[#A3E8B3]', text: 'text-[#1A5C2B]' }, 
    '3': { bg: 'bg-[#E3D1FE]', border: 'border-[#D4B9FD]', text: 'text-[#482881]' }, 
    '4': { bg: 'bg-[#FFBBD7]', border: 'border-[#FF9CBF]', text: 'text-[#871941]' }, 
    '5': { bg: 'bg-[#FBE4A1]', border: 'border-[#F8D87E]', text: 'text-[#7A5B0D]' }, 
    '6': { bg: 'bg-[#FFE2D1]', border: 'border-[#FFCFAE]', text: 'text-[#85451C]' }, 
    '7': { bg: 'bg-[#C2E0FF]', border: 'border-[#99C8FF]', text: 'text-[#0D3C6A]' }, 
    '8': { bg: 'bg-[#E2E8F0]', border: 'border-[#CBD5E1]', text: 'text-[#334155]' }, 
    '9': { bg: 'bg-[#C7D2FE]', border: 'border-[#A5B4FC]', text: 'text-[#3730A3]' }, 
    '10': { bg: 'bg-[#BBF7D0]', border: 'border-[#86EFAC]', text: 'text-[#14532D]' }, 
    '11': { bg: 'bg-[#FECDD3]', border: 'border-[#FDA4AF]', text: 'text-[#881337]' }  
  };

  const nowMinutesFromStart = (now.getHours() * 60 + now.getMinutes()) - (CALENDAR_START_HOUR * 60);
  const PIXELS_PER_HOUR = 80;
  const nowTopPx = (nowMinutesFromStart / 60) * PIXELS_PER_HOUR;

  useEffect(() => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      // Scroll to 8 AM by default, or current time if it's during the day
      const defaultScroll = (8 * PIXELS_PER_HOUR);
      scrollContainerRef.current.scrollTop = Math.max(0, nowTopPx > 0 && nowTopPx < 20 * PIXELS_PER_HOUR ? nowTopPx - containerHeight / 3 : defaultScroll - 40);
    }
  }, []);

  return (
    <div className="flex flex-row h-full w-full bg-white text-zinc-900 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header (Top Navigation) */}
        <div className="h-24 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-[28px] font-semibold text-zinc-900 tracking-tight">
              {view === 'day' 
                ? format(currentDate, 'MMMM d, yyyy') 
                : view === 'week'
                  ? `${format(weekStart, 'MMMM')} ${format(currentDate, 'yyyy')}`
                  : format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Pill Selector */}
            <div className="flex items-center bg-zinc-100 rounded-full p-1 shadow-inner">
              {(['month', 'week', 'day'] as const).map(v => (
                <button 
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-5 py-1.5 text-[13px] font-semibold capitalize rounded-full transition-all ${
                    view === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} className="w-9 h-9 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleToday} className="px-5 h-9 bg-zinc-100 hover:bg-zinc-200 text-[13px] font-semibold text-zinc-700 rounded-xl transition-colors">
                Today
              </button>
              <button onClick={handleNext} className="w-9 h-9 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Optional New Event Button (Can be global if needed) */}
            <button onClick={handleCreateNew} className="ml-2 flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 h-9 rounded-xl text-[13px] font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        </div>

        {error && (
          <div className="px-8 py-3 bg-red-50 text-red-600 text-[13px] flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load calendar: {error.message || 'Unknown error'}</span>
          </div>
        )}
        {isLoading && (
          <div className="px-8 py-3 border-b border-zinc-100 text-zinc-400 text-[13px] font-medium">
            Loading your calendar...
          </div>
        )}

        {/* Days Header */}
        <div className="flex shrink-0 px-4">
          <div className="w-16 shrink-0" /> {/* Time column spacer */}
          <div className={`flex-1 grid gap-4 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {days.map((day, i) => {
              const isActive = view === 'day' ? true : isToday(day);
              return (
                <div key={i} className="flex flex-col items-center justify-center py-4">
                  {isActive ? (
                    <div className="bg-zinc-900 rounded-2xl flex flex-col items-center justify-center py-3 w-[100px] shadow-lg transform transition-transform hover:scale-105 cursor-pointer" onClick={() => { setView('day'); setCurrentDate(day); }}>
                      <div className="text-[12px] font-medium text-zinc-400 capitalize mb-0.5">{format(day, 'EEEE')}</div>
                      <div className="text-[28px] font-bold text-white leading-none">{format(day, 'd')}</div>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 rounded-2xl flex flex-col items-center justify-center py-3 w-[100px] hover:bg-zinc-100 cursor-pointer transition-colors" onClick={() => { setView('day'); setCurrentDate(day); }}>
                      <div className="text-[12px] font-medium text-zinc-500 capitalize mb-0.5">{format(day, 'EEEE')}</div>
                      <div className="text-[28px] font-bold text-zinc-800 leading-none">{format(day, 'd')}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Grid Body */}
        <div className="flex-1 overflow-y-auto flex px-4 relative pb-20" ref={scrollContainerRef}>
          {/* Time Labels */}
          <div className="w-16 shrink-0 relative pt-4">
            {HOURS.map((hour) => (
              <div key={hour} style={{ height: `${PIXELS_PER_HOUR}px` }} className="relative flex justify-end pr-4">
                {hour > 0 && (
                  <span className="text-[12px] font-medium text-zinc-400 -mt-2">
                    {hour === 12 ? '12 pm' : hour > 12 ? `${hour - 12} pm` : `${hour} am`}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className={`flex-1 grid gap-4 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'} relative pt-4`}>
            
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 pointer-events-none left-0 right-0 top-4">
              {HOURS.map((hour) => (
                <div key={hour} style={{ height: `${PIXELS_PER_HOUR}px` }} className="border-t border-zinc-100 w-full" />
              ))}
            </div>

            {/* Vertical Columns and Dynamic Events */}
            {days.map((day, i) => {
              const dayEvents = events.filter((e: any) => e.start && isSameDay(new Date(e.start), day));

              return (
                <div key={i} className="relative">
                  {/* Clickable Background Slots */}
                  <div className="absolute inset-0 top-0">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                        className="w-full cursor-pointer hover:bg-zinc-50/50 transition-colors border-r border-dashed border-zinc-100 last:border-r-0"
                        onClick={() => handleGridClick(day, hour)}
                      />
                    ))}
                  </div>

                  {/* Events */}
                  {dayEvents.map((event: any, idx: number) => {
                    const startD = new Date(event.start);
                    const isAllDay = event.start.length === 10;

                    let top = 0;
                    let height = PIXELS_PER_HOUR / 2;

                    if (!isAllDay) {
                      const endD = event.end ? new Date(event.end) : addMinutes(startD, 30);
                      const startMinutes = (startD.getHours() * 60 + startD.getMinutes()) - (CALENDAR_START_HOUR * 60);
                      const durationMinutes = Math.max(differenceInMinutes(endD, startD), 15);

                      top = (startMinutes / 60) * PIXELS_PER_HOUR;
                      height = (durationMinutes / 60) * PIXELS_PER_HOUR;
                    }

                    if (top + height < 0) return null;

                    // Compute consistent color from event colorId or fallback
                    const cid = event.colorId || '1';
                    const c = GOOGLE_COLORS[cid] || GOOGLE_COLORS['1'];

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                        className={`absolute left-0 right-0 rounded-2xl flex flex-col p-3 cursor-pointer transition-transform hover:scale-[1.02] shadow-sm z-10 ${c.bg} ${c.text} border ${c.border}`}
                        style={{ 
                          top: `${Math.max(0, top)}px`, 
                          height: `${top < 0 ? height + top : height}px`,
                          minHeight: '40px'
                        }}
                      >
                        {height >= 60 && (
                          <span className={`text-[13px] font-semibold mb-1 opacity-90`}>
                            {event.summary || event.title || 'Untitled Event'}
                          </span>
                        )}
                        <span className={`text-[11px] font-medium opacity-80 ${height < 60 ? 'truncate' : ''}`}>
                          {isAllDay ? 'All Day' : `${format(startD, 'h:mm a')} - ${format(event.end ? new Date(event.end) : addMinutes(startD, 30), 'h:mm a')}`}
                          {height < 60 && ` • ${event.summary || event.title || 'Untitled Event'}`}
                        </span>
                      </div>
                    );
                  })}

                  {/* Current Time Line (per active day column) */}
                  {isToday(day) && nowMinutesFromStart >= 0 && (
                    <div
                      className="absolute left-0 right-0 h-[2px] bg-red-400 z-20 pointer-events-none flex items-center"
                      style={{ top: `${nowTopPx}px` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 -ml-[5px] shadow-sm border-2 border-white"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {isCreateModalOpen && (
        <CreateEventModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={handleCreateSubmit} 
          onDelete={handleDeleteEvent}
          initialEvent={selectedEvent}
        />
      )}
    </div>
  );
}
