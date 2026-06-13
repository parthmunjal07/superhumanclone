'use client';

import { useState, useEffect } from 'react';
import { X, Clock, MapPin, Users, AlignLeft, AlertCircle } from 'lucide-react';
import { format, addHours, parseISO } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  defaultStart?: string;
  onSave: () => void;
}

export function EventModal({ isOpen, onClose, event, defaultStart, onSave }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [freeBusyData, setFreeBusyData] = useState<any>(null);
  const [isCheckingFreeBusy, setIsCheckingFreeBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title || '');
        setStart(event.start ? format(new Date(event.start), "yyyy-MM-dd'T'HH:mm") : '');
        setEnd(event.end ? format(new Date(event.end), "yyyy-MM-dd'T'HH:mm") : '');
        setLocation(event.location || '');
        setDescription(event.description || '');
        setAttendees(event.attendees ? event.attendees.map((a: any) => a.email).join(', ') : '');
      } else {
        const startDate = defaultStart ? new Date(defaultStart) : new Date();
        const endDate = addHours(startDate, 1);
        setTitle('');
        setStart(format(startDate, "yyyy-MM-dd'T'HH:mm"));
        setEnd(format(endDate, "yyyy-MM-dd'T'HH:mm"));
        setLocation('');
        setDescription('');
        setAttendees('');
      }
      setError('');
      setFreeBusyData(null);
    }
  }, [isOpen, event, defaultStart]);

  useEffect(() => {
    // Debounced Free/Busy Check
    const handler = setTimeout(async () => {
      if (start && end && attendees.trim()) {
        const emails = attendees.split(',').map(e => e.trim()).filter(e => e && e.includes('@'));
        if (emails.length === 0) return;

        setIsCheckingFreeBusy(true);
        try {
          const res = await fetch('/api/calendar/freebusy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timeMin: new Date(start).toISOString(),
              timeMax: new Date(end).toISOString(),
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
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [start, end, attendees]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        title: title || 'New Event',
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        location,
        description,
        attendees: attendees.split(',').map(e => e.trim()).filter(e => e && e.includes('@')),
        ...(event?.id ? { eventId: event.id } : {})
      };

      const res = await fetch('/api/calendar', {
        method: event?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save event');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasConflicts = freeBusyData && Object.values(freeBusyData).some((cal: any) => cal.busy && cal.busy.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-zinc-800 p-1.5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Event Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-zinc-800 text-2xl text-white font-medium focus:ring-0 focus:border-indigo-500 px-0 py-2 placeholder:text-zinc-600 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                  <Clock className="w-3.5 h-3.5" /> Start
                </label>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                <Users className="w-3.5 h-3.5" /> Attendees
              </label>
              <input
                type="text"
                placeholder="Comma separated emails"
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
              
              {isCheckingFreeBusy ? (
                <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full border-t border-zinc-400 animate-spin"></div>
                  Checking availability...
                </div>
              ) : hasConflicts ? (
                <div className="text-[11px] text-orange-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  One or more attendees are busy at this time.
                </div>
              ) : attendees.trim() && freeBusyData ? (
                <div className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  Everyone is free!
                </div>
              ) : null}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input
                type="text"
                placeholder="Add location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                <AlignLeft className="w-3.5 h-3.5" /> Description
              </label>
              <textarea
                placeholder="Add description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 bg-transparent hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !start || !end}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-indigo-500/20 transition-all"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
