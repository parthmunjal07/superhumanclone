'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/inbox';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Success, redirect to requested redirect param or inbox
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Construct Google OAuth login URL with redirect parameter
  const googleAuthUrl = `/api/auth/google?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-[400px] space-y-8 bg-[#111111] p-10 rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome back</h2>
          <p className="text-[13px] text-zinc-500 font-medium">Please sign in to your account.</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-[13px] text-red-400 font-medium text-center">{error}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="block text-[12px] font-bold tracking-widest text-zinc-500 uppercase">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-2.5 text-[14px] text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all" 
              placeholder="you@example.com" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12px] font-bold tracking-widest text-zinc-500 uppercase">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-2.5 text-[14px] text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all" 
              placeholder="••••••••" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-full shadow-sm text-[14px] font-semibold text-black bg-white hover:bg-zinc-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="relative pt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#222]" />
          </div>
          <div className="relative flex justify-center text-[12px] uppercase tracking-widest font-bold">
            <span className="bg-[#111111] px-3 text-zinc-600">Or</span>
          </div>
        </div>

        {/* OAuth Button */}
        <button
          type="button"
          onClick={() => { window.location.href = googleAuthUrl; }}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-[#333] rounded-full shadow-sm text-[14px] font-semibold text-white bg-[#1a1a1a] hover:bg-[#222] transition-colors"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-[400px] space-y-8 bg-[#111111] p-10 rounded-2xl border border-[#222] shadow-2xl animate-pulse">
        <div>
          <div className="h-6 w-32 bg-[#2a2a2a] rounded-md mb-2"></div>
          <div className="h-3 w-48 bg-[#222] rounded-md"></div>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-3 w-12 bg-[#2a2a2a] rounded-md"></div>
            <div className="h-10 w-full bg-[#1a1a1a] rounded-xl border border-[#333]"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-[#2a2a2a] rounded-md"></div>
            <div className="h-10 w-full bg-[#1a1a1a] rounded-xl border border-[#333]"></div>
          </div>
          <div className="h-10 w-full bg-[#2a2a2a] rounded-full mt-2"></div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
