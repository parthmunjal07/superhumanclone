import { redirect } from 'next/navigation';
import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Mail, Calendar, CheckCircle2 } from 'lucide-react';

export default async function OnboardingPage() {
  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) redirect('/login');
  
  const payload = verifyToken(refreshToken);
  if (!payload) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) redirect('/login');
  if (!user.emailVerifiedAt) redirect('/verify-email');

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Connect your accounts</h1>
          <p className="text-neutral-400 text-lg">Meridian needs to connect to your providers to sync your data.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Gmail Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden transition-all hover:border-neutral-700">
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
              <Mail className="h-8 w-8" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-medium text-white">Connect Gmail</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Meridian needs access to read, send, and manage your emails
              </p>
            </div>
            
            <div className="w-full pt-4">
              {user.gmailConnected ? (
                <div className="flex items-center justify-center space-x-2 text-green-500 bg-green-500/10 py-3 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <Link
                  href="/api/auth/connect/gmail"
                  className="block w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Connect Gmail
                </Link>
              )}
            </div>
          </div>

          {/* Calendar Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden transition-all hover:border-neutral-700">
            <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-2">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-medium text-white">Connect Calendar</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                See your schedule alongside your emails
              </p>
            </div>
            
            <div className="w-full pt-4 space-y-3">
              {user.calendarConnected ? (
                <div className="flex items-center justify-center space-x-2 text-green-500 bg-green-500/10 py-3 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <>
                  <Link
                    href="/api/auth/connect/calendar"
                    className="block w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Connect Calendar <span className="opacity-70 font-normal ml-1">(Optional)</span>
                  </Link>
                  <button className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors mt-2 block w-full text-center">
                    Skip for now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12 pt-8">
          {user.gmailConnected ? (
            <Link
              href="/inbox"
              className="bg-white text-black px-8 py-4 rounded-xl font-medium text-lg hover:bg-neutral-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] flex items-center space-x-2"
            >
              <span>Continue to Meridian</span>
              <span className="text-xl leading-none">→</span>
            </Link>
          ) : (
            <button
              disabled
              className="bg-neutral-800 text-neutral-500 px-8 py-4 rounded-xl font-medium text-lg cursor-not-allowed flex items-center space-x-2"
            >
              <span>Continue to Meridian</span>
              <span className="text-xl leading-none">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
