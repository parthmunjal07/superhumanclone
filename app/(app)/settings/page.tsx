import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { DisconnectButton } from '@/components/DisconnectButton';

export default async function SettingsPage() {
  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) redirect('/login');
  
  const payload = verifyToken(refreshToken);
  if (!payload) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) redirect('/login');

  return (
    <div className="flex-1 p-8 bg-black overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>
      
      <div className="max-w-2xl space-y-6">
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Integrations</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Connect your external accounts to sync data seamlessly via Corsair.
          </p>
          
          <div className="flex items-center justify-between py-4 border-t border-zinc-800">
            <div>
              <h3 className="font-medium text-white flex items-center space-x-2">
                <span>Gmail</span>
                {user.gmailConnected && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Connected</span>}
              </h3>
              <p className="text-sm text-zinc-500">Sync your inbox and send emails</p>
            </div>
            {user.gmailConnected ? (
              <DisconnectButton integration="gmail" label="Gmail" />
            ) : (
              <a 
                href="/api/auth/connect/gmail"
                className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors"
              >
                Connect Gmail
              </a>
            )}
          </div>

          <div className="flex items-center justify-between py-4 border-t border-zinc-800">
            <div>
              <h3 className="font-medium text-white flex items-center space-x-2">
                <span>Google Calendar</span>
                {user.calendarConnected && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Connected</span>}
              </h3>
              <p className="text-sm text-zinc-500">See your schedule alongside your emails</p>
            </div>
            {user.calendarConnected ? (
              <DisconnectButton integration="calendar" label="Calendar" />
            ) : (
              <a 
                href="/api/auth/connect/calendar"
                className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors"
              >
                Connect Calendar
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
