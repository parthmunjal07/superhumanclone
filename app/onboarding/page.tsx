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
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Connect your accounts</h1>
          <p className="text-zinc-500 text-lg">Meridian needs to connect to your providers to sync your data.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Gmail Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden transition-all hover:border-zinc-300 shadow-sm">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2 border border-red-100">
              <Mail className="h-8 w-8" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-medium text-zinc-900">Connect Gmail</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Meridian needs access to read, send, and manage your emails
              </p>
            </div>
            
            <div className="w-full pt-4">
              {user.gmailConnected ? (
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-3 rounded-xl border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <a
                  href="/api/auth/connect/gmail"
                  className="block w-full bg-zinc-900 text-white font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Connect Gmail
                </a>
              )}
            </div>
          </div>

          {/* Calendar Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden transition-all hover:border-zinc-300 shadow-sm">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2 border border-blue-100">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-medium text-zinc-900">Connect Calendar</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                See your schedule alongside your emails
              </p>
            </div>
            
            <div className="w-full pt-4 space-y-3">
              {user.calendarConnected ? (
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-3 rounded-xl border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <>
                  <a
                    href="/api/auth/connect/calendar"
                    className="block w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Connect Calendar <span className="opacity-70 font-normal ml-1">(Optional)</span>
                  </a>
                  <button className="text-zinc-500 text-sm hover:text-zinc-700 transition-colors mt-2 block w-full text-center">
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
              className="bg-zinc-900 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>Continue to Meridian</span>
              <span className="text-xl leading-none">→</span>
            </Link>
          ) : (
            <button
              disabled
              className="bg-zinc-100 text-zinc-400 px-8 py-4 rounded-xl font-medium text-lg cursor-not-allowed flex items-center space-x-2 border border-zinc-200"
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
