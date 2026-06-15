'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Calendar, Video } from 'lucide-react';
import { format, isToday, parseISO, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CalendarSidebar() {
  // Fetch today's events
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  
  const { data, error, isLoading } = useSWR(
    `/api/calendar?timeMin=${encodeURIComponent(todayStart)}&timeMax=${encodeURIComponent(todayEnd)}`, 
    fetcher
  );

  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const events = data?.events || [];

  const displayEvents = events;

  // 24-hour timeline
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventStyle = (event: any) => {
    const start = new Date(event.start?.dateTime || event.start?.date || event.start);
    const end = new Date(event.end?.dateTime || event.end?.date || event.end);
    
    // Relative to midnight for our 24h timeline display
    const dayStart = new Date(start).setHours(0, 0, 0, 0);
    const topDiff = differenceInMinutes(start, dayStart);
    const duration = differenceInMinutes(end, start);
    
    const pixelPerMinute = 80 / 60; // 80px per hour block

    return {
      top: `${topDiff * pixelPerMinute}px`,
      height: `${duration * pixelPerMinute}px`,
    };
  };

  const getThemeColors = (colorId?: string) => {
    const id = colorId || '1';
    const googleColors: Record<string, string> = {
      '1': 'bg-[#CBE4FF] border-l-[#B4D7FF]', '2': 'bg-[#BCF0C8] border-l-[#A3E8B3]', 
      '3': 'bg-[#E3D1FE] border-l-[#D4B9FD]', '4': 'bg-[#FFBBD7] border-l-[#FF9CBF]',
      '5': 'bg-[#FBE4A1] border-l-[#F8D87E]', '6': 'bg-[#FFE2D1] border-l-[#FFCFAE]', 
      '7': 'bg-[#C2E0FF] border-l-[#99C8FF]', '8': 'bg-[#E2E8F0] border-l-[#CBD5E1]',
      '9': 'bg-[#C7D2FE] border-l-[#A5B4FC]', '10': 'bg-[#BBF7D0] border-l-[#86EFAC]', 
      '11': 'bg-[#FECDD3] border-l-[#FDA4AF]'
    };
    return googleColors[id] || googleColors['1'];
  };

  // Current time indicator calculation
  const dayStartHour = new Date().setHours(0, 0, 0, 0);
  const currentTimeDiff = differenceInMinutes(currentTime, dayStartHour);
  const pixelPerMinute = 80 / 60;
  const showCurrentTime = currentTimeDiff >= 0 && currentTimeDiff <= 24 * 60;

  return (
    <div className="w-[320px] bg-white border-l border-zinc-200 flex flex-col h-full shrink-0">
      <div className="h-[72px] flex items-center px-6 border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-900" />
          <h2 className="text-[14px] font-semibold text-zinc-900">Today's Calendar</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 relative">
        {isLoading && <div className="text-sm text-zinc-500 text-center">Loading events...</div>}
        
        {!isLoading && (
          <div className="relative">
            {/* Timeline grid */}
            {hours.map((hour, i) => (
              <div key={hour} className="flex relative h-[80px]">
                <div className="w-12 text-[11px] font-medium text-zinc-400 -mt-2">
                  {hour === 0 ? '12 AM' : hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
                <div className="flex-1 border-t border-zinc-100 relative"></div>
              </div>
            ))}

            {/* Current Time Line */}
            {showCurrentTime && (
              <div 
                className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                style={{ top: `${currentTimeDiff * pixelPerMinute}px`, transform: 'translateY(-50%)' }}
              >
                <div className="w-10 bg-blue-600 text-white text-[10px] font-bold py-0.5 rounded-full text-center shadow-sm">
                  {format(currentTime, 'h.mm')}
                </div>
                <div className="flex-1 h-[2px] bg-blue-600"></div>
              </div>
            )}

            {/* Event Cards */}
            <div className="absolute top-0 left-12 right-0 bottom-0 pointer-events-none">
              {displayEvents.map((event: any, idx: number) => {
                const style = getEventStyle(event);
                const colorClass = getThemeColors(event.colorId);
                
                return (
                  <div 
                    key={event.id}
                    onClick={() => router.push(`/calendar?editEventId=${event.id}`)}
                    className={`absolute left-0 right-0 rounded-2xl border-l-[3px] shadow-sm p-3 pointer-events-auto transition-transform hover:scale-[1.02] cursor-pointer ${colorClass}`}
                    style={style}
                  >
                    <h3 className="text-[13px] font-semibold text-zinc-900 mb-1 line-clamp-2 leading-tight">{event.title || event.summary || 'Untitled Event'}</h3>
                    {event.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mb-1.5">{event.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto absolute bottom-3 left-3 right-3">
                      <p className="text-[11px] text-zinc-500 font-medium">
                        {format(new Date(event.start?.dateTime || event.start?.date || event.start), 'h:mm a')} - {format(new Date(event.end?.dateTime || event.end?.date || event.end), 'h:mm a')}
                      </p>
                      {event.hangoutLink && (
                        <a href={event.hangoutLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white border border-zinc-200 shadow-sm rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
