'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Calendar, Bot, Settings, List, LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(220);

  const navigation = [
    { name: 'Inbox', href: '/inbox', icon: Inbox },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Digest', href: '/digest', icon: List },
    { name: 'Agent', href: '/agent', icon: Bot },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Extract user initials
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div 
      style={{ width: sidebarWidth }}
      className="flex h-full flex-col bg-[#111111] border-r border-[#222] shrink-0 relative"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-zinc-500/50 z-50 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = sidebarWidth;
          const onMouseMove = (moveEvent: MouseEvent) => {
            setSidebarWidth(Math.max(150, Math.min(400, startWidth + (moveEvent.clientX - startX))));
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
      {/* Brand */}
      <div className="flex h-20 items-center px-5 gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
          <LayoutGrid className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-white tracking-tight leading-tight">Postbox</span>
          <span className="text-[10px] font-bold text-zinc-500 tracking-[0.1em] uppercase">Calendar</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl px-3 py-2 text-[14px] font-medium transition-colors ${isActive
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-zinc-400 hover:bg-[#151515] hover:text-zinc-200'
                  }`}
              >
                <Icon
                  className={`mr-3 h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-400'
                    }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User */}
      <div className="border-t border-[#222] p-3">
        <div className="flex items-center gap-3 px-2 py-1.5 cursor-pointer group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-[12px] font-bold text-white shrink-0 shadow-md transition-transform group-hover:scale-105">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[14px] font-semibold text-white">{user?.name || 'User'}</p>
            <p className="truncate text-[12px] text-zinc-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-[#222] rounded-md transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
