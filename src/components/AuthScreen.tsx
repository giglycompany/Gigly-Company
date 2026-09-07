import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, KeyRound, Mail, Lock } from 'lucide-react';
import { auth, signInWithGoogle, saveUserProfileToFirestore } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { GiglyLogo } from './GiglyLogo';

interface AuthScreenProps {
  onSuccess: (role?: 'freelancer' | 'business') => void;
  onAdminClick: () => void;
  onBackToStartup: () => void;
}

export function AuthScreen({ onSuccess, onAdminClick, onBackToStartup }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setLoading(false);
      onSuccess();
    } catch (err: any) {
      console.warn('Firebase Auth notice:', err);
      // If user already exists on signup, try logging in or show friendly message
      if (err.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
          setLoading(false);
          onSuccess();
          return;
        } catch {
          setError('Email already exists. Switch to Log in tab to continue.');
        }
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        // Fallback for prototype preview
        setError(err.message || 'Authentication error.');
      }
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        // Automatically ensure user profile is in Firestore
        const u = result.user;
        const initials = (u.displayName || 'GU')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        await saveUserProfileToFirestore(u.uid, {
          name: u.displayName || 'Gigly Member',
          role: 'freelancer',
          roleTitle: 'Independent Specialist & Consultant',
          rateOrBudget: '$65 / hr',
          bio: 'Building, creating, and matching with innovative teams on Gigly.',
          skills: ['UI/UX', 'Full-stack', 'Strategy'],
          email: u.email || '',
          avatarInitials: initials || 'GM',
          verified: true,
          stats: {
            appliedOrPosted: 12,
            hired: 8,
            ratingOrResponse: '4.9 ★',
          },
        });
      }
      setLoading(false);
      onSuccess();
    } catch (err: any) {
      console.error('Firebase Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain unauthorized in Firebase Auth. Please check authorized domains in Firebase Console.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in provider is disabled in your Firebase console.');
      } else {
        setError(err.message || 'Google authentication failed.');
      }
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'freelancer' | 'business') => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('Demo login notice:', err);
    }
    onSuccess(role);
  };

  const handleForgot = async () => {
    if (!email) {
      setError('Enter your email address first, then click "Forgot password?".');
      return;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Password reset link sent to ${email}.`);
    } catch (err: any) {
      setSuccessMsg(`Password reset request processed for ${email}.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="relative w-full max-w-[440px] min-h-[640px] h-[100dvh] flex flex-col justify-between p-6 overflow-y-auto bg-[#FFFCF5] select-none"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          onClick={onBackToStartup}
          className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center cursor-pointer shadow-[2px_3px_0px_0px_#000] hover:translate-y-[-1px] transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <GiglyLogo size="md" />
        <div className="w-10" />
      </div>

      {/* Main Card */}
      <div className="bg-white border-[3px] border-black rounded-[26px] p-6 shadow-[6px_8px_0px_0px_#000] my-auto">
        {/* Switcher Tabs */}
        <div className="flex gap-1.5 bg-[#FFFCF5] border-[2.5px] border-black rounded-full p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 font-display font-bold text-[13px] rounded-full transition-colors ${
              tab === 'login' ? 'bg-[#FFC629] text-black shadow-[1px_2px_0px_0px_#000]' : 'text-[#6E6E6E]'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 font-display font-bold text-[13px] rounded-full transition-colors ${
              tab === 'signup' ? 'bg-[#FFC629] text-black shadow-[1px_2px_0px_0px_#000]' : 'text-[#6E6E6E]'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Title */}
        <h2 className="font-display font-[800] text-[24px] text-black">
          {tab === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-[13px] font-semibold text-[#6E6E6E] mt-1 mb-5">
          {tab === 'login' ? 'Log in to start swiping gigs and talent.' : 'Sign up to match in seconds.'}
        </p>

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border-[1.5px] border-red-400 text-red-700 text-[12px] font-semibold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-green-50 border-[1.5px] border-green-500 text-green-700 text-[12px] font-semibold">
            {successMsg}
          </div>
        )}

        {/* Google Continue */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white border-[2.5px] border-black rounded-full font-display font-bold text-[14px] shadow-[3px_4px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.4 34.9 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.8 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.3-5.7 6.9l6.5 5.4C39.9 37.6 44 31.6 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-[1.5px] bg-black/10" />
          <span className="text-[11px] font-bold uppercase text-[#6E6E6E] tracking-wider">or email</span>
          <div className="flex-1 h-[1.5px] bg-black/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>
          </div>

          {tab === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgot}
                className="text-[11px] font-bold text-[#6E6E6E] underline hover:text-black"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FFC629] text-black font-display font-[800] text-[15px] rounded-full border-[2.5px] border-black cursor-pointer shadow-[3px_4px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform mt-2"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        {/* Quick Instant Demo Buttons */}
        <div className="mt-5 pt-4 border-t border-dashed border-black/15">
          <p className="text-[11px] font-bold text-center text-[#6E6E6E] uppercase tracking-wider mb-2.5">
            ⚡ Quick Demo Preview
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('freelancer')}
              className="py-2 px-2.5 bg-[#FFF9E6] border-2 border-black rounded-xl text-[11px] font-bold text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFC629] transition-colors text-center"
            >
              Freelancer Mode
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('business')}
              className="py-2 px-2.5 bg-[#FFF9E6] border-2 border-black rounded-xl text-[11px] font-bold text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFC629] transition-colors text-center"
            >
              Business Mode
            </button>
          </div>
        </div>
      </div>

      {/* Admin Footnote Link */}
      <div className="text-center pt-3 pb-1">
        <button
          onClick={onAdminClick}
          className="text-[11px] font-semibold text-[#8E8E8E] underline hover:text-black"
        >
          Admin Dashboard
        </button>
      </div>
    </motion.div>
  );
}
