import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, FileText, Send, Save, MapPin, Video } from 'lucide-react';

export interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (payload: { title: string; start: string; end: string; description: string; attendees: string[]; addMeetLink?: boolean }) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  initialEvent?: {
    id: string;
    title: string;
    start: string;
    end: string;
    description: string;
    attendees: string[];
    colorId?: string | null;
    hangoutLink?: string | null;
  } | null;
}

export default function CreateEventModal({ onClose, onCreate, onDelete, initialEvent }: CreateEventModalProps) {
  const getInitialDate = (isoString?: string) => isoString ? new Date(isoString).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const getInitialTime = (isoString?: string) => {
    if (!isoString) return '10:00';
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const [title, setTitle] = useState(initialEvent?.title || '');
  const [startDate, setStartDate] = useState(getInitialDate(initialEvent?.start));
  const [startTime, setStartTime] = useState(getInitialTime(initialEvent?.start));
  const [endDate, setEndDate] = useState(getInitialDate(initialEvent?.end));
  const [endTime, setEndTime] = useState(getInitialTime(initialEvent?.end || (initialEvent?.start ? new Date(new Date(initialEvent.start).getTime() + 30 * 60000).toISOString() : undefined)) || '11:00');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [attendeesInput, setAttendeesInput] = useState(initialEvent?.attendees?.join(', ') || '');
  const [addMeetLink, setAddMeetLink] = useState(!!initialEvent?.hangoutLink);
  const [colorId, setColorId] = useState(initialEvent?.colorId || '1');
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isCreating) return;
    if (!title) {
      setError("Please specify a title.");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setError("End time must be after start time.");
      return;
    }

    const attendees = attendeesInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      setIsCreating(true);
      setError(null);
      await onCreate({ title, start: startDateTime, end: endDateTime, description, attendees, addMeetLink, ...(colorId ? { colorId } : {}) } as any);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save event. Please try again.");
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEvent?.id || !onDelete || isCreating) return;
    try {
      setIsCreating(true);
      setError(null);
      await onDelete(initialEvent.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete event. Please try again.");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-200">
      {/* Click outside to close (optional, but handled by Escape key) */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div
        className="w-[440px] bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200 relative z-10"
        onKeyDown={handleKeyDown}
      >
        {/* Header / Title Input */}
        <div className="pt-8 px-8 pb-4 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-[24px] font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
            placeholder="Event Title..."
            autoFocus
          />
        </div>

        <div className="px-8 pb-8 flex flex-col gap-4">
          {error && (
            <div className="px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Date Picker (Unified) */}
          <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-2 px-4 transition-colors focus-within:bg-zinc-100">
            <CalendarIcon className="w-5 h-5 text-zinc-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setEndDate(e.target.value); // Keep end date synced for simplicity on 1-day events
              }}
              className="flex-1 bg-transparent text-zinc-700 text-[15px] font-medium focus:outline-none cursor-pointer py-1"
            />
          </div>

          {/* Time Picker */}
          <div className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-2 px-4 transition-colors focus-within:bg-zinc-100">
            <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
            <div className="flex flex-1 items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-transparent text-zinc-700 text-[15px] font-medium focus:outline-none cursor-pointer py-1 w-full"
              />
              <span className="text-zinc-400 text-[15px] font-medium">-</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-transparent text-zinc-700 text-[15px] font-medium focus:outline-none cursor-pointer py-1 w-full"
              />
            </div>
          </div>

          {/* Location / Description */}
          <div className="flex items-start gap-3 bg-zinc-50 rounded-2xl p-2 px-4 transition-colors focus-within:bg-zinc-100">
            <MapPin className="w-5 h-5 text-zinc-400 shrink-0 mt-1.5" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex-1 bg-transparent text-zinc-700 text-[15px] font-medium focus:outline-none placeholder:text-zinc-400 py-1.5 resize-none"
              placeholder="Add location or description..."
            />
          </div>

          {/* Attendees */}
          <div className="flex items-start gap-3 bg-zinc-50 rounded-2xl p-2 px-4 transition-colors focus-within:bg-zinc-100">
            <Users className="w-5 h-5 text-zinc-400 shrink-0 mt-1.5" />
            <textarea
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              rows={2}
              className="flex-1 bg-transparent text-zinc-700 text-[15px] font-medium focus:outline-none placeholder:text-zinc-400 py-1.5 resize-none"
              placeholder="Add guests (emails)... They will be emailed the Meet link."
            />
          </div>

          {/* Google Meet Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Video className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-zinc-900">Google Meet</div>
                {initialEvent?.hangoutLink ? (
                  <a href={initialEvent.hangoutLink} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 hover:underline">
                    {initialEvent.hangoutLink}
                  </a>
                ) : (
                  <div className="text-[12px] text-zinc-500">Add video conferencing</div>
                )}
              </div>
            </div>
            {!initialEvent?.hangoutLink && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={addMeetLink} onChange={e => setAddMeetLink(e.target.checked)} />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 pt-2 px-2">
            {[...Array(11)].map((_, i) => {
              const id = (i + 1).toString();
              const googleColors: Record<string, string> = {
                '1': 'bg-[#CBE4FF]', '2': 'bg-[#BCF0C8]', '3': 'bg-[#E3D1FE]', '4': 'bg-[#FFBBD7]',
                '5': 'bg-[#FBE4A1]', '6': 'bg-[#FFE2D1]', '7': 'bg-[#C2E0FF]', '8': 'bg-[#E2E8F0]',
                '9': 'bg-[#C7D2FE]', '10': 'bg-[#BBF7D0]', '11': 'bg-[#FECDD3]'
              };
              return (
                <button
                  key={id}
                  onClick={() => setColorId(id)}
                  className={`w-6 h-6 rounded-full ${googleColors[id]} flex items-center justify-center transition-transform hover:scale-110 ${colorId === id ? 'ring-2 ring-zinc-900 ring-offset-2 scale-110' : ''}`}
                  title={`Color ${id}`}
                />
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            {initialEvent && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isCreating}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-50"
              >
                Delete Event
              </button>
            )}
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 rounded-xl text-[15px] font-semibold transition-colors shadow-md disabled:opacity-50"
            >
              {isCreating ? 'Saving...' : (initialEvent ? 'Save Changes' : 'Add Event')}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
