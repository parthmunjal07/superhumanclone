import { format } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  body: string;
  from: string;
  date: string;
  priorityLevel: string | null;
  isRead: boolean;
}

export default function EmailItem({ email, isSelected }: { email: Email; isSelected?: boolean }) {
  // Extract name from "Name <email@example.com>" format
  const senderMatch = email.from.match(/^([^<]+)</);
  const senderName = senderMatch ? senderMatch[1].trim() : email.from;

  // Format date
  const emailDate = new Date(email.date);
  const isToday = new Date().toDateString() === emailDate.toDateString();
  const timeString = isToday ? format(emailDate, 'h:mm a').toUpperCase() : format(emailDate, 'EEE');

  // Priority config
  const priorityConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    URGENT: { dot: 'bg-red-500',    bg: 'bg-red-500/20',    text: 'text-red-400',    label: 'URGENT' },
    NORMAL: { dot: 'bg-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'NORMAL' },
    FYI:    { dot: 'bg-zinc-500',   bg: 'bg-zinc-700/50',   text: 'text-zinc-400',   label: 'FYI' },
  };
  const priority = email.priorityLevel ? priorityConfig[email.priorityLevel.toUpperCase()] : null;

  // Strip HTML for clean preview
  const previewText = email.body.replace(/<[^>]*>/g, '').slice(0, 140);

  return (
    <div
      className={`px-4 py-4 cursor-pointer transition-colors border-b border-[#2a2a2a] ${
        isSelected
          ? 'bg-[#252525]'
          : 'hover:bg-[#1e1e1e]'
      }`}
    >
      {/* Row 1: Priority dot + Sender + Time */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {priority && (
            <div className={`w-[7px] h-[7px] rounded-full ${priority.dot} shrink-0`} />
          )}
          <span className={`text-[13px] truncate ${
            email.isRead ? 'text-zinc-400 font-medium' : 'text-white font-semibold'
          }`}>
            {senderName}
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-600 tabular-nums shrink-0 ml-3">
          {timeString}
        </span>
      </div>

      {/* Row 2: Subject */}
      <p className={`text-[13px] truncate mb-1 ${
        email.isRead ? 'text-zinc-500' : 'text-zinc-200 font-semibold'
      }`}>
        {email.subject}
      </p>

      {/* Row 3: Preview */}
      <p className="text-[12px] text-zinc-600 line-clamp-2 leading-relaxed mb-2">
        {previewText}
      </p>

      {/* Row 4: Priority pill */}
      {priority && (
        <span className={`inline-block text-[10px] font-bold tracking-wider px-2 py-[3px] rounded ${priority.bg} ${priority.text} font-mono`}>
          {priority.label}
        </span>
      )}
    </div>
  );
}
