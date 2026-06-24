'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { ShieldCheck, LogIn, Phone, KeyRound, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle, signInWithDemo } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Set App Check debug token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = "Ae0iMNeGrb9MV0oyVzrIURiS37ObNTlRc3zHfRR06NreVC6Omks9MAQNjRkZk6C9uhKmwYulwiIKeOlamzJL6B7EO_9ByovNm4UiiVh5-q9NyKV_8O1pQxH7sJ-yJYBHNzLcu97JBdCTG-tWz4ktRTnxVQ";
    }
  }, []);

  // Redirect to home if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Cleanup Recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error('Error clearing recaptcha on unmount:', e);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleDemoSignIn = (role: 'citizen' | 'validator' | 'authority' | 'admin' = 'citizen') => {
    setError(null);
    setSuccess(null);
    try {
      signInWithDemo(role);
      setSuccess('Logged in using local demo profile.');
      router.push('/');
    } catch (err: any) {
      setError('Failed to sign in with demo profile.');
    }
  };

  // Setup Recaptcha
  const setupRecaptcha = () => {
    const container = document.getElementById('recaptcha-container');
    if (!container) return;

    if (window.recaptchaVerifier && container.hasChildNodes()) {
      const globalWindow = window as any;
      if (globalWindow.grecaptcha && globalWindow.recaptchaWidgetId !== undefined) {
        try {
          globalWindow.grecaptcha.reset(globalWindow.recaptchaWidgetId);
        } catch (e) {
          console.error('Error resetting recaptcha on reuse:', e);
        }
      }
      return; // Reuse the existing verifier
    }

    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore clear error
        }
        window.recaptchaVerifier = undefined;
      }
      
      container.innerHTML = '';

      const verifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('g-recaptcha-response solved');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        }
      );

      verifier.render().then((widgetId) => {
        (window as any).recaptchaWidgetId = widgetId;
      }).catch((err) => {
        console.error('Error rendering recaptcha:', err);
      });

      window.recaptchaVerifier = verifier;
    } catch (err: any) {
      console.error('Error initializing recaptcha:', err);
      setError('Failed to initialize security verifier.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number (include country code, e.g. +919876543210).');
      setLoading(false);
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('reCAPTCHA verifier not initialized.');
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      confirmationResultRef.current = confirmationResult;
      setStep('otp');
      setSuccess('Verification code sent successfully!');
    } catch (err: any) {
      console.error('Phone auth error:', err);
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        setError('Firebase Phone Authentication is not enabled in your project console. Please enable the "Phone" provider under Authentication -> Sign-in method, or bypass using the demo button below.');
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('Phone sign-in is not allowed/enabled for this Firebase project. Please enable the "Phone" provider in the Firebase Console under Authentication -> Sign-in method.');
      } else if (err.code === 'auth/internal-error' || err.message?.includes('internal-error')) {
        setError('Firebase Authentication encountered an internal error. This is often due to reCAPTCHA loading issues. Please check your network and ensure your local development server is whitelisted.');
      } else {
        setError(err.message || 'Failed to send OTP code. Ensure correct country code prefix.');
      }

      // Reset the reCAPTCHA so the user can try again
      const globalWindow = window as any;
      if (globalWindow.grecaptcha && globalWindow.recaptchaWidgetId !== undefined) {
        try {
          globalWindow.grecaptcha.reset(globalWindow.recaptchaWidgetId);
        } catch (e) {
          console.error('Error resetting grecaptcha after failure:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      if (!confirmationResultRef.current) {
        throw new Error('No active verification session found. Please request a new code.');
      }
      await confirmationResultRef.current.confirm(otp);
      setSuccess('Logged in successfully!');
      router.push('/');
    } catch (err: any) {
      console.error('OTP confirmation error:', err);
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('Google sign-in is not allowed/enabled for this Firebase project. Please enable the "Google" provider in the Firebase Console under Authentication -> Sign-in method.');
      } else {
        setError(err.message || 'Google Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-gray-400 text-sm">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10">
        
        {/* Header logo / slogan */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to CommunityHero</h2>
          <p className="text-xs text-gray-400 max-w-xs">
            Report local issues, validation tickets, and earn civic contribution points.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Forms */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-semibold text-gray-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Format: International code prefix (+91 for India, +1 for US) followed by 10-digit number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-violet-600/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Send Verification OTP
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-xs font-semibold text-gray-300">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 tracking-[0.3em] font-mono text-center focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="flex-1 py-2.5 bg-zinc-950 border border-white/10 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-violet-600/20"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900/60 px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google sign-in option */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-gray-300 hover:text-white font-medium rounded-lg text-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google Authentication
          </button>

          <button
            onClick={() => handleDemoSignIn('citizen')}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white font-medium rounded-lg text-sm transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            Bypass with Demo Account
          </button>
        </div>

        {/* Invisible ReCAPTCHA Container */}
        <div id="recaptcha-container" ref={recaptchaContainerRef} className="mt-4"></div>

        {/* Demo notification */}
        <div className="flex items-center gap-2 mt-6 p-2 rounded bg-violet-500/5 border border-violet-500/10 text-center text-[10px] text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span>If Firebase is in demo mode, auth will immediately resolve to a mock citizen profile.</span>
        </div>

      </div>
    </div>
  );
}
