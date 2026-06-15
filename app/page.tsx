'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans">
      <div className="max-w-2xl text-center space-y-8 px-4">
        <h1 className="text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-600">
          Superhuman for Everyone
        </h1>
        <p className="text-xl text-zinc-500">
          The fastest email and calendar experience ever made. Powered by Corsair, integrated with everything you need.
        </p>

        <div className="pt-8 min-h-[80px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-12 space-x-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          ) : user ? (
            <Link 
              href="/inbox" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
            >
              Go to Inbox
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
              >
                Log In
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all duration-200 shadow-sm hover:border-zinc-300"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
