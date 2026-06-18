'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response from server:", text);
        throw new Error(text.length > 50 ? text.substring(0, 50) + "..." : text || "Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(data.message || 'Account created! Please check your email to verify.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-4 font-sans selection:bg-blue-500/30 relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-[13px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-[400px] space-y-8 bg-white p-10 rounded-2xl border border-zinc-200 shadow-xl relative overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Create an account</h2>
          <p className="text-[13px] text-zinc-500 font-medium">Join to experience blazing fast email.</p>
        </div>
        
        {/* Manual Register Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-[13px] font-medium text-center">{error}</div>}
          {success && <div className="text-emerald-600 text-[13px] font-medium text-center">{success}</div>}
          
          <div className="space-y-1.5">
            <label className="block text-[12px] font-bold tracking-widest text-zinc-500 uppercase">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="Jane Doe" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12px] font-bold tracking-widest text-zinc-500 uppercase">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="you@example.com" 
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12px] font-bold tracking-widest text-zinc-500 uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="••••••••" 
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-full shadow-sm text-[14px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-all mt-2"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="relative pt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-[12px] uppercase tracking-widest font-bold">
            <span className="bg-white px-3 text-zinc-500">Or</span>
          </div>
        </div>

        {/* OAuth Button */}
        <button
          type="button"
          onClick={() => { window.location.href = '/api/auth/google'; }}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-zinc-200 rounded-full shadow-sm text-[14px] font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="text-center pt-2">
          <p className="text-[13px] text-zinc-500 font-medium">
            Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
