'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Plus, X, Video, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
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

  // Form & Pane State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(360);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setSelectedEventId(null);
    setTitle('');
    setStartText(format(d, "yyyy-MM-dd'T'HH:mm"));
    setEndText(format(addMinutes(d, 30), "yyyy-MM-dd'T'HH:mm"));
    setRecurrence('NONE');
    setAttendeesText('');
    setDescription('');
    setColorId(null);
    setFormError('');
    setFreeBusyData(null);
    setIsPanelOpen(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEventId(event.id);
    setTitle(event.title || '');
    setStartText(event.start ? format(new Date(event.start), "yyyy-MM-dd'T'HH:mm") : '');
    const startD = new Date(event.start);
    const endD = event.end ? new Date(event.end) : addMinutes(startD, 30);
    setEndText(format(endD, "yyyy-MM-dd'T'HH:mm"));
    setRecurrence('NONE'); // Edit master instance recurrence is not supported for now
    setAttendeesText(event.attendees ? event.attendees.map((a: any) => a.email).join(', ') : '');
    setDescription(event.description || '');
    setColorId(event.colorId || null);
    setFormError('');
    setFreeBusyData(null);
    setIsPanelOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedEventId(null);
    setTitle('');
    setStartText(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setEndText(format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm"));
    setRecurrence('NONE');
    setAttendeesText('');
    setDescription('');
    setFormError('');
    setFreeBusyData(null);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
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

  const handleSubmit = async () => {
    if (!startText) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const startDate = new Date(startText);
      const endDate = new Date(endText);

      const payload = {
        title: title || 'New Event',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        description,
        attendees: attendeesText.split(',').map(e => e.trim()).filter(e => e && e.includes('@')),
        ...(colorId ? { colorId } : {}),
        ...(recurrence !== 'NONE' ? { recurrence: [recurrence] } : {}),
        ...(selectedEventId ? { eventId: selectedEventId } : {})
      };

      const res = await fetch('/api/calendar', {
        method: selectedEventId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save event');
      }

      mutate();
      handleClosePanel(); // clear form and close on success
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventId) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`/api/calendar?eventId=${selectedEventId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete event');
      }
      mutate();
      handleClosePanel();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Right Sidebar - Create Event */}
      {isPanelOpen && (
        <div
          style={{ width: panelWidth }}
          className="shrink-0 bg-[#111] flex flex-col h-full overflow-hidden border-l border-[#222] relative"
        >
          {/* Resize Handle */}
          <div
            className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-zinc-500/50 z-50 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = panelWidth;
              const onMouseMove = (moveEvent: MouseEvent) => {
                setPanelWidth(Math.max(300, Math.min(600, startWidth - (moveEvent.clientX - startX))));
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

          <div className="p-6 flex-1 overflow-y-auto pb-20">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase">
                {selectedEventId ? 'Edit Event' : 'Create Event'}
              </span>
              <button className="text-zinc-500 hover:text-white transition-colors" onClick={handleClosePanel}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-6">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Date / Time */}
              <div className="gap-4">
                <div className="flex-1 mb-4">
                  <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Start</label>
                  <input
                    type="datetime-local"
                    value={startText}
                    onChange={e => {
                      setStartText(e.target.value);
                      if (endText && new Date(e.target.value) >= new Date(endText)) {
                        setEndText(format(addMinutes(new Date(e.target.value), 30), "yyyy-MM-dd'T'HH:mm"));
                      }
                    }}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">End</label>
                  <input
                    type="datetime-local"
                    value={endText}
                    onChange={e => setEndText(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Repeat */}
              {!selectedEventId && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Repeat</label>
                  <select
                    value={recurrence}
                    onChange={e => setRecurrence(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
                  >
                    <option value="NONE">Does not repeat</option>
                    <option value="RRULE:FREQ=DAILY">Daily</option>
                    <option value="RRULE:FREQ=WEEKLY">Weekly</option>
                    <option value="RRULE:FREQ=MONTHLY">Monthly</option>
                    <option value="RRULE:FREQ=YEARLY">Yearly</option>
                    <option value="RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR">Every weekday (Mon-Fri)</option>
                  </select>
                </div>
              )}

              {/* Attendees */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Attendees</label>
                <div className="flex flex-col gap-2 bg-[#222] border border-[#333] rounded-lg p-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {attendeeEmails.map((email, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-2 py-1 text-[12px] text-zinc-300">
                        <div className="w-3.5 h-3.5 bg-indigo-600 rounded flex items-center justify-center text-[8px] font-bold text-white uppercase">
                          {email[0]}
                        </div>
                        {email}
                        <button
                          onClick={() => {
                            const newEmails = attendeeEmails.filter(e => e !== email);
                            setAttendeesText(newEmails.join(', '));
                          }}
                          className="text-zinc-500 hover:text-white ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={attendeesText}
                    onChange={e => setAttendeesText(e.target.value)}
                    placeholder={attendeeEmails.length === 0 ? "Add comma separated emails..." : "Add..."}
                    className="bg-transparent text-[13px] text-white placeholder:text-zinc-500 focus:outline-none px-1"
                  />
                </div>
              </div>

              {/* Free / Busy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase">Free / Busy</label>
                  {isCheckingFreeBusy ? (
                    <span className="text-[10px] font-bold text-zinc-500 tracking-[0.1em] uppercase">Checking...</span>
                  ) : freeBusyData ? (
                    hasConflicts ? (
                      <span className="text-[10px] font-bold text-orange-500 tracking-[0.1em] uppercase">Conflicts Found</span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-500 tracking-[0.1em] uppercase">No Conflicts</span>
                    )
                  ) : null}
                </div>

                {freeBusyData && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 mb-1">
                      {attendeeEmails.map((email, i) => {
                        const isBusy = freeBusyData[email]?.busy?.length > 0;
                        return (
                          <div key={i} title={email} className={`flex-1 py-1 text-[9px] font-bold text-center rounded ${isBusy ? 'bg-[#3d1830] text-[#f8659f]' : 'bg-[#123636] text-[#34d399]'}`}>
                            {isBusy ? 'BUSY' : 'FREE'}
                          </div>
                        );
                      })}
                    </div>
                    {hasConflicts && (
                      <div className="text-[12px] text-orange-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        One or more attendees are busy.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Notes</label>
                <textarea
                  placeholder="Agenda, context..."
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setColorId(null)} className={`w-6 h-6 rounded-full border-2 ${!colorId ? 'border-white' : 'border-transparent'} bg-[#333]`} title="Default" />
                  <button onClick={() => setColorId('1')} className={`w-6 h-6 rounded-full border-2 ${colorId === '1' ? 'border-white' : 'border-transparent'} bg-[#7986cb]`} title="Lavender" />
                  <button onClick={() => setColorId('2')} className={`w-6 h-6 rounded-full border-2 ${colorId === '2' ? 'border-white' : 'border-transparent'} bg-[#33b679]`} title="Sage" />
                  <button onClick={() => setColorId('3')} className={`w-6 h-6 rounded-full border-2 ${colorId === '3' ? 'border-white' : 'border-transparent'} bg-[#8e24aa]`} title="Grape" />
                  <button onClick={() => setColorId('4')} className={`w-6 h-6 rounded-full border-2 ${colorId === '4' ? 'border-white' : 'border-transparent'} bg-[#e67c73]`} title="Flamingo" />
                  <button onClick={() => setColorId('5')} className={`w-6 h-6 rounded-full border-2 ${colorId === '5' ? 'border-white' : 'border-transparent'} bg-[#f6c026]`} title="Banana" />
                  <button onClick={() => setColorId('6')} className={`w-6 h-6 rounded-full border-2 ${colorId === '6' ? 'border-white' : 'border-transparent'} bg-[#f5511d]`} title="Tangerine" />
                  <button onClick={() => setColorId('7')} className={`w-6 h-6 rounded-full border-2 ${colorId === '7' ? 'border-white' : 'border-transparent'} bg-[#039be5]`} title="Peacock" />
                  <button onClick={() => setColorId('8')} className={`w-6 h-6 rounded-full border-2 ${colorId === '8' ? 'border-white' : 'border-transparent'} bg-[#616161]`} title="Graphite" />
                  <button onClick={() => setColorId('9')} className={`w-6 h-6 rounded-full border-2 ${colorId === '9' ? 'border-white' : 'border-transparent'} bg-[#3f51b5]`} title="Blueberry" />
                  <button onClick={() => setColorId('10')} className={`w-6 h-6 rounded-full border-2 ${colorId === '10' ? 'border-white' : 'border-transparent'} bg-[#0b8043]`} title="Basil" />
                  <button onClick={() => setColorId('11')} className={`w-6 h-6 rounded-full border-2 ${colorId === '11' ? 'border-white' : 'border-transparent'} bg-[#d50000]`} title="Tomato" />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleClosePanel}
                    className="flex-1 py-2 rounded-lg border border-[#333] bg-[#1a1a1a] text-[13px] font-semibold text-zinc-300 hover:bg-[#222] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !startText}
                    className="flex-1 py-2 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (selectedEventId ? 'Update Event' : <><Plus className="w-4 h-4" /> Create Event</>)}
                  </button>
                </div>
                {selectedEventId && (
                  <button
                    onClick={handleDeleteEvent}
                    disabled={isSubmitting}
                    className="w-full py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-[13px] font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Delete Event
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
