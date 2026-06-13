'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Plus, X, Video, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
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
  // force recompile to fix dev server bug
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  // Update "now" every minute for the timeline
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // For day view, cover the full day (midnight to midnight)
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
    // month view
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
  const [title, setTitle] = useState('');
  const [startText, setStartText] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endText, setEndText] = useState(format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm"));
  const [recurrence, setRecurrence] = useState('NONE');
  const [attendeesText, setAttendeesText] = useState('');
  const [description, setDescription] = useState('');
  const [colorId, setColorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [freeBusyData, setFreeBusyData] = useState<any>(null);
  const [isCheckingFreeBusy, setIsCheckingFreeBusy] = useState(false);

  // Handlers
  const handleGridClick = (day: Date, hour: number) => {
    // We can pass default start/end times to the modal in the future
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent({
      id: event.id,
      title: event.title || '',
      start: event.start || '',
      end: event.end || '',
      description: event.description || '',
      attendees: event.attendees ? event.attendees.map((a: any) => a.email) : []
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  };

  const handleClosePanel = () => {
    setIsCreateModalOpen(false);
  };

  // Free Busy Check
  useEffect(() => {
    const handler = setTimeout(async () => {
      const emails = attendeesText.split(',').map(e => e.trim()).filter(e => e && e.includes('@'));
      if (emails.length > 0 && startText && endText) {
        setIsCheckingFreeBusy(true);
        try {
          const startDate = new Date(startText);
          const endDate = new Date(endText);
          const res = await fetch('/api/calendar/freebusy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timeMin: startDate.toISOString(),
              timeMax: endDate.toISOString(),
              items: emails
            })
          });
          if (res.ok) {
            const data = await res.json();
            setFreeBusyData(data.freeBusy);
          }
        } catch (err) {
          console.error("Free/busy check failed", err);
        } finally {
          setIsCheckingFreeBusy(false);
        }
      } else {
        setFreeBusyData(null);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [startText, endText, attendeesText]);

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

  const hasConflicts = freeBusyData && Object.values(freeBusyData).some((cal: any) => cal.busy && cal.busy.length > 0);
  const attendeeEmails = attendeesText.split(',').map(e => e.trim()).filter(e => e);

  const bgColors = ['bg-[#111f3d]', 'bg-[#1d1136]', 'bg-[#0c2323]', 'bg-[#2d2211]', 'bg-[#2a1122]'];
  const borderColors = ['border-[#2d56a3]', 'border-[#4c279c]', 'border-[#1b6b55]', 'border-[#a17021]', 'border-[#a22b5e]'];
  const textColors = ['text-[#60a5fa]', 'text-[#a78bfa]', 'text-[#34d399]', 'text-[#fbbf24]', 'text-[#f8659f]'];

  // Calculate timeline position
  const nowMinutesFromStart = (now.getHours() * 60 + now.getMinutes()) - (CALENDAR_START_HOUR * 60);
  const nowTopPx = (nowMinutesFromStart / 60) * 64;

  // Auto-scroll to center current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollTop = Math.max(0, nowTopPx - containerHeight / 2);
    }
  }, []); // Run once on mount

  return (
    <div className="flex flex-row h-full w-full bg-[#0d0d0d] text-white overflow-hidden">
      {/* Main Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-24 flex items-center justify-between px-8 shrink-0 border-b border-[#222]">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 tracking-[0.1em] uppercase mb-1">
              {view === 'day' ? 'Day of' : view === 'week' ? 'Week of' : 'Month of'}
            </div>
            <h2 className="text-[24px] font-bold text-white tracking-tight leading-none">
              {view === 'day' 
                ? format(currentDate, 'MMMM d, yyyy') 
                : view === 'week'
                  ? `${format(weekStart, 'MMMM d')} – ${format(weekEnd, 'd, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#151515] border border-[#222] rounded-lg p-1">
              <button 
                onClick={() => setView('day')}
                className={`px-4 py-1.5 text-[11px] font-bold transition-colors uppercase tracking-wider ${view === 'day' ? 'text-zinc-200 bg-[#2a2a2a] rounded-md' : 'text-zinc-500 hover:text-white'}`}
              >
                Day
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-4 py-1.5 text-[11px] font-bold transition-colors uppercase tracking-wider ${view === 'week' ? 'text-zinc-200 bg-[#2a2a2a] rounded-md' : 'text-zinc-500 hover:text-white'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setView('month')}
                className={`px-4 py-1.5 text-[11px] font-bold transition-colors uppercase tracking-wider ${view === 'month' ? 'text-zinc-200 bg-[#2a2a2a] rounded-md' : 'text-zinc-500 hover:text-white'}`}
              >
                Month
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handlePrev} className="p-2 bg-[#151515] border border-[#222] hover:bg-[#222] text-zinc-400 hover:text-white rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleToday} className="px-4 py-1.5 bg-[#151515] border border-[#222] hover:bg-[#222] text-[11px] font-bold text-zinc-400 hover:text-white rounded-lg transition-colors uppercase tracking-wider">
                Today
              </button>
              <button onClick={handleNext} className="p-2 bg-[#151515] border border-[#222] hover:bg-[#222] text-zinc-400 hover:text-white rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button onClick={handleCreateNew} className="ml-2 flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded-lg text-[13px] font-bold transition-colors">
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        </div>

        {/* Error / Loading States */}
        {error && (
          <div className="px-8 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-[13px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load calendar: {error.message || 'Unknown error'}</span>
          </div>
        )}
        {isLoading && (
          <div className="px-8 py-3 border-b border-[#222] text-zinc-500 text-[13px]">
            Loading calendar events...
          </div>
        )}

        {/* Calendar Grid Container */}
        {view === 'month' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-[#222] shrink-0">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-2 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-r border-[#222] last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Month Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-[1fr] overflow-hidden">
              {days.map((day, i) => {
                const dayEvents = events.filter((e: any) => e.start && isSameDay(new Date(e.start), day));
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                return (
                  <div key={i} className={`border-r border-b border-[#222] flex flex-col p-1 overflow-hidden cursor-pointer hover:bg-white/5 transition-colors ${isCurrentMonth ? 'bg-transparent' : 'bg-[#111] opacity-50'}`} onClick={() => { setView('day'); setCurrentDate(day); }}>
                    <div className={`text-[12px] font-bold p-1 w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? 'bg-white text-black' : 'text-zinc-400'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-1 hide-scrollbar">
                      {dayEvents.map((event: any, idx: number) => {
                        const colorIdx = event.id ? event.id.charCodeAt(0) % bgColors.length : idx % bgColors.length;
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer ${bgColors[colorIdx]} ${textColors[colorIdx]} hover:opacity-80`}
                          >
                            {event.title || '(No Title)'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
          {/* Days Header */}
          <div className="flex border-b border-[#222] shrink-0">
            <div className="w-16 shrink-0 border-r border-[#222]" />
            <div className={`flex-1 grid ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
              {days.map((day, i) => {
                return (
                  <div key={i} className="flex flex-col items-center justify-center py-3 border-r border-[#222] last:border-r-0">
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{format(day, 'EEE')}</div>
                    <div className={`text-[18px] font-bold w-9 h-9 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-white text-black' : 'text-zinc-200'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scrollable Grid Body */}
          <div className="flex-1 overflow-y-auto flex" ref={scrollContainerRef}>
            {/* Time Labels */}
            <div className="w-16 shrink-0 border-r border-[#222] relative bg-[#0a0a0a]">
              {HOURS.map((hour) => (
                <div key={hour} className="h-16 relative">
                  {hour > 0 && (
                    <span className="absolute -top-2 right-3 text-[10px] font-mono font-medium text-zinc-500">
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid Columns */}
            <div className={`flex-1 grid ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'} relative`}>
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-16 border-t border-[#222] w-full" />
                ))}
              </div>

              {/* Current Time Line */}
              {nowMinutesFromStart >= 0 && nowTopPx <= (HOURS.length * 64) && (
                <div
                  className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none flex items-center"
                  style={{ top: `${nowTopPx}px` }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                </div>
              )}

              {/* Vertical Columns and Dynamic Events */}
              {days.map((day, i) => {
                const dayEvents = events.filter((e: any) => {
                  if (!e.start) return false;
                  const d = new Date(e.start);
                  return isSameDay(d, day);
                });

                return (
                  <div key={i} className="relative border-r border-[#222] last:border-r-0">
                    {/* Clickable Slots */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 w-full hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => handleGridClick(day, hour)}
                      />
                    ))}

                    {/* Events */}
                    {dayEvents.map((event: any, idx: number) => {
                      const startD = new Date(event.start);
                      const isAllDay = event.start.length === 10;

                      let top = 0;
                      let height = 16;

                      if (!isAllDay) {
                        const endD = event.end ? new Date(event.end) : addDays(startD, 1);
                        const startMinutesFrom9 = (startD.getHours() * 60 + startD.getMinutes()) - (CALENDAR_START_HOUR * 60);
                        const durationMinutes = Math.max(differenceInMinutes(endD, startD), 15);

                        top = (startMinutesFrom9 / 60) * 64; // 64px per hour (h-16 = 4rem = 64px)
                        height = (durationMinutes / 60) * 64;
                      }

                      // Only render if it falls partially or fully in our 9am-6pm window
                      if (top + height < 0) return null; // before 9am

                      const colorIdx = event.id ? event.id.charCodeAt(0) % bgColors.length : idx % bgColors.length;

                      const googleColors: Record<string, { bg: string, border: string, text: string }> = {
                        '1': { bg: 'bg-[#7986cb]/20', border: 'border-[#7986cb]', text: 'text-[#7986cb]' },
                        '2': { bg: 'bg-[#33b679]/20', border: 'border-[#33b679]', text: 'text-[#33b679]' },
                        '3': { bg: 'bg-[#8e24aa]/20', border: 'border-[#8e24aa]', text: 'text-[#8e24aa]' },
                        '4': { bg: 'bg-[#e67c73]/20', border: 'border-[#e67c73]', text: 'text-[#e67c73]' },
                        '5': { bg: 'bg-[#f6c026]/20', border: 'border-[#f6c026]', text: 'text-[#f6c026]' },
                        '6': { bg: 'bg-[#f5511d]/20', border: 'border-[#f5511d]', text: 'text-[#f5511d]' },
                        '7': { bg: 'bg-[#039be5]/20', border: 'border-[#039be5]', text: 'text-[#039be5]' },
                        '8': { bg: 'bg-[#616161]/20', border: 'border-[#616161]', text: 'text-[#616161]' },
                        '9': { bg: 'bg-[#3f51b5]/20', border: 'border-[#3f51b5]', text: 'text-[#3f51b5]' },
                        '10': { bg: 'bg-[#0b8043]/20', border: 'border-[#0b8043]', text: 'text-[#0b8043]' },
                        '11': { bg: 'bg-[#d50000]/20', border: 'border-[#d50000]', text: 'text-[#d50000]' }
                      };

                      const c = event.colorId && googleColors[event.colorId] ? googleColors[event.colorId] : { bg: bgColors[colorIdx], border: borderColors[colorIdx], text: textColors[colorIdx] };

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                          className={`absolute left-1 right-1 rounded flex flex-col p-1.5 cursor-pointer transition-colors z-10 ${c.bg} border ${c.border} hover:opacity-80`}
                          style={{ top: `${Math.max(0, top)}px`, height: `${top < 0 ? height + top : height}px` }}
                        >
                          <span className={`text-[10px] font-mono font-bold truncate ${c.text}`}>
                            {format(startD, 'h:mm a')}
                          </span>
                          {!isAllDay && height >= 48 && top >= 0 && (
                            <span className="text-[11px] font-bold text-white truncate leading-tight mt-0.5">
                              {event.title}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
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
