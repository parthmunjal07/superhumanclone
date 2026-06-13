'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  addWeeks, 
  isSameDay, 
  parseISO,
  differenceInMinutes,
  isToday
} from 'date-fns';
import { EventModal } from '@/components/EventModal';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/calendar?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`,
    fetcher
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [defaultStart, setDefaultStart] = useState<string | undefined>(undefined);

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

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setDefaultStart(undefined);
    setIsModalOpen(true);
  };

  const handleGridClick = (day: Date, hour: number) => {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setDefaultStart(d.toISOString());
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setDefaultStart(new Date().toISOString());
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 bg-zinc-950">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white min-w-[150px]">
            {format(weekStart, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button onClick={handlePrevWeek} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
              Today
            </button>
            <button onClick={handleNextWeek} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {isLoading && <div className="text-xs text-zinc-500 animate-pulse ml-4">Loading...</div>}
          {error && <div className="text-xs text-red-500 ml-4">Failed to load events</div>}
        </div>
        
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      {/* Week Grid */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Days Header */}
        <div className="flex border-b border-zinc-800 shrink-0">
          <div className="w-16 shrink-0 border-r border-zinc-800/50" />
          <div className="flex-1 grid grid-cols-7">
            {days.map((day, i) => (
              <div key={i} className="text-center py-3 border-r border-zinc-800/50 last:border-r-0">
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-1">{format(day, 'EEE')}</div>
                <div className={`text-lg font-semibold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-500 text-white' : 'text-zinc-200'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Grid Body */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Time Labels */}
          <div className="w-16 shrink-0 border-r border-zinc-800/50 bg-zinc-950 relative">
            {HOURS.map((hour) => (
              <div key={hour} className="h-20 relative">
                <span className="absolute -top-2.5 right-2 text-xs font-medium text-zinc-500 pr-2">
                  {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'ha')}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map((hour) => (
                <div key={hour} className="h-20 border-t border-zinc-800/30 w-full" />
              ))}
            </div>

            {/* Vertical Columns */}
            {days.map((day, i) => {
              const dayEvents = events.filter((e: any) => {
                if (!e.start) return false;
                // Treat all-day events as starting at midnight of that day
                const d = new Date(e.start);
                return isSameDay(d, day);
              });

              return (
                <div key={i} className="relative border-r border-zinc-800/50 last:border-r-0">
                  {/* Clickable Slots */}
                  {HOURS.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-20 w-full hover:bg-zinc-900/30 cursor-pointer transition-colors"
                      onClick={() => handleGridClick(day, hour)}
                    />
                  ))}
                  
                  {/* Events */}
                  {dayEvents.map((event: any) => {
                    const startD = new Date(event.start);
                    // Handle all-day events gracefully
                    const isAllDay = event.start.length === 10;
                    
                    let top = 0;
                    let height = 20; // default height for all day
                    
                    if (!isAllDay) {
                      const endD = event.end ? new Date(event.end) : addDays(startD, 1);
                      const startMinutes = startD.getHours() * 60 + startD.getMinutes();
                      const durationMinutes = Math.max(differenceInMinutes(endD, startD), 30); // min 30m height
                      
                      top = (startMinutes / 60) * 80; // 80px per hour
                      height = (durationMinutes / 60) * 80;
                    }

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                        className="absolute left-1 right-1 rounded-md overflow-hidden bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/30 hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col z-10"
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${event.title}\n${event.description || ''}`}
                      >
                        <div className="px-2 py-1 flex-1 overflow-hidden">
                          <div className="text-xs font-semibold truncate group-hover:text-indigo-100">{event.title}</div>
                          {!isAllDay && height >= 40 && (
                            <div className="text-[10px] text-indigo-300/80 truncate">
                              {format(startD, 'h:mm a')} - {event.end ? format(new Date(event.end), 'h:mm a') : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        defaultStart={defaultStart}
        onSave={() => mutate()}
      />
    </div>
  );
}
