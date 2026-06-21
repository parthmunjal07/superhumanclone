import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { redirect } from 'next/navigation';
import { DisconnectButton } from '@/components/DisconnectButton';
import { Settings, Mail, Calendar as CalendarIcon, CheckCircle2, Sparkles, Slack, Globe, ListTodo } from 'lucide-react';

export default async function SettingsPage() {
  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) redirect('/login');

  const payload = verifyToken(refreshToken);
  if (!payload) redirect('/login');

  let user: any;
  if (payload.userId === 'demo-user') {
    user = {
      id: 'demo-user',
      role: 'PRO',
      gmailConnected: true,
      calendarConnected: true,
    };
  } else {
    user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
  }

  if (!user) redirect('/login');

  const userRole = user.role || 'FREE';
  let asksLeft = null;
  if (userRole === 'FREE') {
    const today = new Date().toISOString().split('T')[0];
    const rateLimitKey = `ratelimit:ai:${user.id}:${today}`;
    try {
      const requestsStr = await redis.get(rateLimitKey);
      const requests = requestsStr ? parseInt(requestsStr, 10) : 0;
      asksLeft = Math.max(0, 5 - requests);
    } catch (e) {
      console.error('Failed to get redis rate limit:', e);
      asksLeft = 5;
    }
  }

  return (
    <div className="flex-1 bg-[#F9FAFB] h-full overflow-y-auto font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10 lg:px-12 lg:py-16 space-y-10">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-zinc-900" />
            <h1 className="text-4xl lg:text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
          </div>
          <p className="text-zinc-500 text-lg">Manage your connected accounts and preferences.</p>
        </div>

        {/* Integrations Section */}
        <section className="bg-white border border-zinc-200 rounded-[32px] p-8 lg:p-10 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Integrations</h2>
            <p className="text-zinc-500 text-[15px]">
              Connect your external accounts to sync data seamlessly via Corsair.
            </p>
          </div>

          <div className="space-y-6">
            {/* Gmail Integration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFE2D1] border border-[#FFCFAE] flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-[#85451C]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-3">
                    Gmail
                    {user.gmailConnected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-[#BCF0C8] text-[#1A5C2B] px-3 py-1 rounded-full border border-[#A3E8B3]">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Sync your inbox and manage your emails securely.</p>
                </div>
              </div>
              <div className="shrink-0 mt-4 sm:mt-0">
                {user.gmailConnected ? (
                  <DisconnectButton integration="gmail" label="Gmail" />
                ) : (
                  <a
                    href="/api/auth/connect/gmail"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-900 text-white text-[15px] font-semibold rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    Connect
                  </a>
                )}
              </div>
            </div>

            {/* Google Calendar Integration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#CBE4FF] border border-[#B4D7FF] flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-6 h-6 text-[#1E4C82]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-3">
                    Google Calendar
                    {user.calendarConnected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-[#BCF0C8] text-[#1A5C2B] px-3 py-1 rounded-full border border-[#A3E8B3]">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">See your schedule alongside your emails and plan ahead.</p>
                </div>
              </div>
              <div className="shrink-0 mt-4 sm:mt-0">
                {user.calendarConnected ? (
                  <DisconnectButton integration="calendar" label="Calendar" />
                ) : (
                  <a
                    href="/api/auth/connect/calendar"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-900 text-white text-[15px] font-semibold rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
                  >
                    Connect
                  </a>
                )}
              </div>
            </div>
            </div>

            {/* Slack Integration (Coming Soon) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors opacity-60 grayscale-[0.5]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8E1ED] border border-[#D6CBE0] flex items-center justify-center shrink-0">
                  <Slack className="w-6 h-6 text-[#4A154B]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-3">
                    Slack
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600 px-3 py-1 rounded-full border border-zinc-300">
                      Coming Soon
                    </span>
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Connect your workspace and let the AI manage your messages.</p>
                </div>
              </div>
              <div className="shrink-0 mt-4 sm:mt-0">
                <button disabled className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-200 text-zinc-500 text-[15px] font-semibold rounded-full cursor-not-allowed">
                  Connect
                </button>
              </div>
            </div>

            {/* Linear Integration (Coming Soon) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors opacity-60 grayscale-[0.5]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EAEAF2] border border-[#D5D5E8] flex items-center justify-center shrink-0">
                  <ListTodo className="w-6 h-6 text-[#5E6AD2]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-3">
                    Linear
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600 px-3 py-1 rounded-full border border-zinc-300">
                      Coming Soon
                    </span>
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Manage issues, projects, and cycles seamlessly from Meridian.</p>
                </div>
              </div>
              <div className="shrink-0 mt-4 sm:mt-0">
                <button disabled className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-200 text-zinc-500 text-[15px] font-semibold rounded-full cursor-not-allowed">
                  Connect
                </button>
              </div>
            </div>

            {/* Tavily Integration (Coming Soon) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors opacity-60 grayscale-[0.5]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-[#0284C7]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-3">
                    Tavily Search
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600 px-3 py-1 rounded-full border border-zinc-300">
                      Coming Soon
                    </span>
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Supercharge your AI assistant with real-time web search capabilities.</p>
                </div>
              </div>
              <div className="shrink-0 mt-4 sm:mt-0">
                <button disabled className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-200 text-zinc-500 text-[15px] font-semibold rounded-full cursor-not-allowed">
                  Connect
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* AI Usage Section (Only for FREE users) */}
        {userRole === 'FREE' && asksLeft !== null && (
          <section className="bg-white border border-zinc-200 rounded-[32px] p-8 lg:p-10 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Meridian AI</h2>
              <p className="text-zinc-500 text-[15px]">
                Your daily limits for the AI assistant.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-zinc-50" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-3">
                    Daily Asks
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">You have {asksLeft} ask{asksLeft === 1 ? '' : 's'} remaining today.</p>
                </div>
              </div>
              <div className="shrink-0 mt-4 sm:mt-0">
                <button
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-900 text-white text-[15px] font-semibold rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Shortcuts Section */}
        <section className="bg-white border border-zinc-200 rounded-[32px] p-8 lg:p-10 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Keyboard Shortcuts</h2>
            <p className="text-zinc-500 text-[15px]">
              Navigate Meridian at the speed of thought without leaving your keyboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <span className="text-[15px] font-medium text-zinc-900">Compose new email</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm">c</kbd>
            </div>
            <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <span className="text-[15px] font-medium text-zinc-900">Reply to selected email</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm">r</kbd>
            </div>
            <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <span className="text-[15px] font-medium text-zinc-900">Archive selected email</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm">e</kbd>
            </div>
            <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <span className="text-[15px] font-medium text-zinc-900">Search emails</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm">/</kbd>
            </div>
            <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <span className="text-[15px] font-medium text-zinc-900">Toggle shortcut overlay</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm">?</kbd>
            </div>
            <div className="flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:bg-white transition-colors">
              <span className="text-[15px] font-medium text-zinc-900">Close reading pane</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg shadow-sm">Esc</kbd>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
