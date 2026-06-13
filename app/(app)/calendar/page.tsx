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
  differenceInMinutes
} from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CALENDAR_START_HOUR = 0;

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Update "now" every minute for the timeline
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/calendar?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`,
    fetcher
  );

  const events = data?.events || [];

  const days = useMemo(() => {
    const d = [];
    for (let i = 0; i < 7; i++) {
      d.push(addDays(weekStart, i));
    }
    return d;
  }, [weekStart]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Form & Pane State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(360);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [startText, setStartText] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState(30); // minutes
  const [attendeesText, setAttendeesText] = useState('');
  const [description, setDescription] = useState('');
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
    setDuration(30);
    setAttendeesText('');
    setDescription('');
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
    setDuration(Math.max(differenceInMinutes(endD, startD), 15));
    setAttendeesText(event.attendees ? event.attendees.map((a: any) => a.email).join(', ') : '');
    setDescription(event.description || '');
    setFormError('');
    setFreeBusyData(null);
    setIsPanelOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedEventId(null);
    setTitle('');
    setStartText(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setDuration(30);
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
      if (emails.length > 0 && startText) {
        setIsCheckingFreeBusy(true);
        try {
          const startDate = new Date(startText);
          const endDate = addMinutes(startDate, duration);
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
  }, [startText, duration, attendeesText]);

  const handleSubmit = async () => {
    if (!startText) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      const startDate = new Date(startText);
      const endDate = addMinutes(startDate, duration);
      
      const payload = {
        title: title || 'New Event',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        description,
        attendees: attendeesText.split(',').map(e => e.trim()).filter(e => e && e.includes('@')),
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
            <div className="text-[10px] font-bold text-zinc-500 tracking-[0.1em] uppercase mb-1">Week of</div>
            <h2 className="text-[24px] font-bold text-white tracking-tight leading-none">
              {format(weekStart, 'MMMM d')} – {format(weekEnd, 'd, yyyy')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-[#151515] border border-[#222] rounded-lg p-1">
              <button className="px-4 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">Day</button>
              <button className="px-4 py-1.5 text-[11px] font-bold text-zinc-200 bg-[#2a2a2a] rounded-md transition-colors uppercase tracking-wider">Week</button>
              <button className="px-4 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">Month</button>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={handlePrevWeek} className="p-2 bg-[#151515] border border-[#222] hover:bg-[#222] text-zinc-400 hover:text-white rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleToday} className="px-4 py-1.5 bg-[#151515] border border-[#222] hover:bg-[#222] text-[11px] font-bold text-zinc-400 hover:text-white rounded-lg transition-colors uppercase tracking-wider">
                Today
              </button>
              <button onClick={handleNextWeek} className="p-2 bg-[#151515] border border-[#222] hover:bg-[#222] text-zinc-400 hover:text-white rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button onClick={handleCreateNew} className="ml-2 flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-4 py-2 rounded-lg text-[13px] font-bold transition-colors">
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
          {/* Days Header */}
          <div className="flex border-b border-[#222] shrink-0">
            <div className="w-16 shrink-0 border-r border-[#222]" />
            <div className="flex-1 grid grid-cols-7">
              {days.map((day, i) => {
                return (
                <div key={i} className="flex flex-col items-center justify-center py-3 border-r border-[#222] last:border-r-0">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{format(day, 'EEE')}</div>
                  <div className={`text-[18px] font-bold w-9 h-9 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-white text-black' : 'text-zinc-200'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              )})}
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
            <div className="flex-1 grid grid-cols-7 relative">
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

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                          className={`absolute left-1 right-1 rounded flex flex-col p-1.5 cursor-pointer transition-colors z-10 ${bgColors[colorIdx]} border ${borderColors[colorIdx]} hover:opacity-80`}
                          style={{ top: `${Math.max(0, top)}px`, height: `${top < 0 ? height + top : height}px` }}
                        >
                          <span className={`text-[10px] font-mono font-bold truncate ${textColors[colorIdx]}`}>
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
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Start</label>
                <input 
                  type="datetime-local" 
                  value={startText}
                  onChange={e => setStartText(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]" 
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 tracking-[0.15em] uppercase mb-2">Duration</label>
                <div className="flex items-center gap-2">
                  {[30, 45, 60, 120].map(mins => (
                    <button 
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`flex-1 py-1.5 rounded-md border text-[12px] font-medium transition-colors ${
                        duration === mins 
                          ? 'border-white bg-white text-black font-semibold' 
                          : 'border-[#333] bg-[#222] text-zinc-400 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {mins === 60 ? '1h' : mins === 120 ? '2h' : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

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

              <div className="flex gap-3 pt-2">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
