import { format, isToday } from 'date-fns';
import { Calendar, Sparkles, Check, CheckSquare } from 'lucide-react';
import React, { useState } from 'react';

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
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  // Extract name and initials
  const senderMatch = email.from.match(/^([^<]+)</);
  const senderName = senderMatch ? senderMatch[1].trim() : email.from;
  const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Format date
  const emailDate = new Date(email.date);
  const timeString = isToday(emailDate) ? format(emailDate, 'h:mm a') : format(emailDate, 'MMM d');

  // Preview logic
  const previewText = email.body.replace(/<[^>]*>/g, '').slice(0, 150);
  
  // Fake logo assignment for UI showcase based on sender name length
  const getAvatarStyle = () => {
    const len = senderName.length;
    if (len % 4 === 0) return { bg: 'bg-red-600', text: 'text-white' };
    if (len % 4 === 1) return { bg: 'bg-blue-600', text: 'text-white' };
    if (len % 4 === 2) return { bg: 'bg-green-200', text: 'text-green-700' };
    return { bg: 'bg-zinc-800', text: 'text-white' };
  };
  const avatarStyle = getAvatarStyle();

  // Mock AI summary data specific to the request
  const isWebinar = senderName.toLowerCase().includes('scaler') || email.subject.toLowerCase().includes('webinar');
  const isInvite = email.subject.toLowerCase().includes('invite');
  const hasActionCard = isWebinar || isInvite || email.priorityLevel === 'URGENT';

  let mockSummary = '';
  let actionButton = 'Add to Calendar';
  let isAdded = false;

  if (isWebinar) {
    mockSummary = "Reminder for today's 4PM webinar on scaling strategies. Zoom link and session agenda included.";
  } else if (isInvite) {
    mockSummary = "You're invited to an exclusive event. Come mingle, share insights, and hear mini-pitches.";
    actionButton = 'Added to Calendar';
    isAdded = true;
  } else if (email.priorityLevel === 'URGENT') {
    mockSummary = "This email requires your immediate attention regarding project blocking issues.";
  }

  return (
    <div
      className={`px-5 py-4 cursor-pointer transition-colors border-b border-zinc-100 flex gap-4 ${
        isSelected ? 'bg-zinc-50/80' : 'hover:bg-zinc-50'
      }`}
    >
      {/* Checkbox (mock) */}
      <div className="mt-1 flex-shrink-0">
        <div className="w-4 h-4 rounded-md border border-zinc-300 flex items-center justify-center hover:border-zinc-400 transition-colors"></div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm ${avatarStyle.bg} ${avatarStyle.text}`}>
              {initials}
            </div>
            <span className={`text-[15px] truncate flex items-center gap-2 ${
              email.isRead ? 'text-zinc-600 font-medium' : 'text-zinc-900 font-bold'
            }`}>
              {senderName}
              {!email.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
            </span>
          </div>
          <span className="text-[12px] text-zinc-500 font-medium shrink-0 pt-0.5">
            {timeString}
          </span>
        </div>

        <p className={`text-[14px] truncate mb-1 pl-9 ${
          email.isRead ? 'text-zinc-600' : 'text-zinc-900 font-semibold'
        }`}>
          {email.subject}
        </p>

        <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed pl-9 mb-3">
          {previewText}
        </p>

        {hasActionCard && isSummaryVisible && (
          <div className="pl-9 pr-4 mb-3">
            <div className="bg-[#F3F4F9] border border-[#E5E7EB]/50 rounded-xl p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[13px] text-blue-900/80 font-medium leading-relaxed">
                  {mockSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasActionCard && (
          <div className="pl-9 flex items-center gap-2 mt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSummaryVisible(!isSummaryVisible); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm bg-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSummaryVisible ? 'Hide Summary' : 'View Summary'}
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors shadow-sm ${
                isAdded 
                ? 'bg-blue-50 border border-blue-100 text-blue-600' 
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              {actionButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
