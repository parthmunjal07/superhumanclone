import { formatDistanceToNow, format } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  body: string;
  from: string;
  date: string;
  priorityLevel: string | null;
  isRead: boolean;
}

export default function EmailItem({ email }: { email: Email }) {
  // Simple extract name from "Name <email@example.com>" format
  const senderMatch = email.from.match(/^([^<]+)</);
  const senderName = senderMatch ? senderMatch[1].trim() : email.from;

  // Format date: if today, show time; else show "MMM d"
  const emailDate = new Date(email.date);
  const isToday = new Date().toDateString() === emailDate.toDateString();
  const timeString = isToday ? format(emailDate, 'h:mm a') : format(emailDate, 'MMM d');

  // Priority Dot Color
  let dotColor = 'bg-transparent';
  if (email.priorityLevel === 'High') dotColor = 'bg-red-500';
  else if (email.priorityLevel === 'Normal') dotColor = 'bg-yellow-500';
  else if (email.priorityLevel === 'Low') dotColor = 'bg-green-500';

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        email.isRead 
          ? 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800' 
          : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 shadow-[inset_2px_0_0_0_#6366f1]'
      }`}
    >
      <div className="flex justify-between items-baseline mb-1">
        <div className="flex items-center gap-2 overflow-hidden">
          {email.priorityLevel && (
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} title={`Priority: ${email.priorityLevel}`} />
          )}
          <span className={`text-sm truncate ${email.isRead ? 'text-zinc-300 font-medium' : 'text-white font-bold'}`}>
            {senderName}
          </span>
        </div>
        <span className={`text-xs flex-shrink-0 ml-2 ${email.isRead ? 'text-zinc-500' : 'text-indigo-400 font-medium'}`}>
          {timeString}
        </span>
      </div>
      <p className={`text-sm truncate mb-0.5 ${email.isRead ? 'text-zinc-400' : 'text-zinc-200 font-semibold'}`}>
        {email.subject}
      </p>
      <p className="text-sm text-zinc-500 truncate">
        {email.body}
      </p>
    </div>
  );
}
