import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, FileText, Send, Save } from 'lucide-react';

export interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (payload: { title: string; start: string; end: string; description: string; attendees: string[] }) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  initialEvent?: {
    id: string;
    title: string;
    start: string;
    end: string;
    description: string;
    attendees: string[];
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
      await onCreate({ title, start: startDateTime, end: endDateTime, description, attendees });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create event. Please try again.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-200">
      <div
        className="w-[600px] bg-[#111111] border border-[#222] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-[#222]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight leading-none mb-1.5">{initialEvent ? 'Edit Event' : 'New Event'}</h2>
              <p className="text-[12px] text-zinc-500 font-medium">{initialEvent ? 'Update your calendar event' : 'Create a new calendar event'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-[12px] font-medium font-mono">
            <button onClick={onClose} className="hover:text-white transition-colors ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-2 bg-red-900/50 text-red-300 text-xs border border-red-800/50 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1 text-zinc-500">
              <span className="text-[11px] font-bold tracking-[0.15em]">TITLE</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 text-zinc-200 text-[14px] font-medium focus:outline-none focus:border-[#444] placeholder:text-zinc-600 transition-colors"
              placeholder="E.g., Weekly Sync"
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 px-1 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tracking-[0.15em]">STARTS</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-[#151515] border border-[#222] rounded-xl px-3 py-2.5 text-zinc-300 text-[13px] font-medium focus:outline-none focus:border-[#444] transition-colors"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-32 bg-[#151515] border border-[#222] rounded-xl px-3 py-2.5 text-zinc-300 text-[13px] font-medium focus:outline-none focus:border-[#444] transition-colors"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 px-1 text-zinc-500">
                <span className="text-[11px] font-bold tracking-[0.15em]">ENDS</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-[#151515] border border-[#222] rounded-xl px-3 py-2.5 text-zinc-300 text-[13px] font-medium focus:outline-none focus:border-[#444] transition-colors"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-32 bg-[#151515] border border-[#222] rounded-xl px-3 py-2.5 text-zinc-300 text-[13px] font-medium focus:outline-none focus:border-[#444] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1 text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold tracking-[0.15em]">GUESTS</span>
            </div>
            <input
              type="text"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 text-zinc-300 text-[13px] font-medium focus:outline-none focus:border-[#444] placeholder:text-zinc-600 transition-colors"
              placeholder="email@example.com, another@example.com"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1 text-zinc-500">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold tracking-[0.15em]">DESCRIPTION</span>
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 text-zinc-300 text-[14px] leading-relaxed focus:outline-none focus:border-[#444] placeholder:text-zinc-600 transition-colors resize-none"
              placeholder="Add event details..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#222] flex items-center justify-between bg-[#151515] shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#333] bg-[#1a1a1a] text-zinc-500 text-[11px] font-mono font-medium tracking-wide">
            <span className="font-sans text-[13px] opacity-80">⌘ ↵</span> to save
          </div>

          <div className="flex items-center gap-3">
            {initialEvent && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isCreating}
                className="bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-800/50 px-4 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isCreating ? 'Saving...' : (initialEvent ? 'Save Changes' : 'Create Event')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
