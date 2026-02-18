'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiMail, FiPhone } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import EmailAuth from '@/components/auth/EmailAuth';
import PhoneAuth from '@/components/auth/PhoneAuth';
import { authAPI, getFriendlyError } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/utils/firebaseAuth';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '@/utils/recaptcha';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function FirebaseLoginPage() {
  const router = useRouter();
  const { updateUser, isAuthenticated, loading, setLoginInProgress } = useAuth();
  const { getToken } = useRecaptcha();
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [googleLoading, setGoogleLoading] = useState(false);
  const [syncingBackend, setSyncingBackend] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, router]);

  if (!loading && isAuthenticated) {
    return null;
  }

  /**
   * Handle successful Firebase authentication
   * Sync Firebase user with backend with retry and clear error feedback
   */
  const handleFirebaseSuccess = async (result) => {
    const toastId = 'firebase-sync';
    try {
      const { user, token } = result;

      if (!user?.email && !user?.phoneNumber) {
        toast.error("Unable to retrieve your account info. Please try again.");
        return;
      }

      if (!token) {
        toast.error("Failed to get authentication token. Please try again.");
        return;
      }

      // Show syncing state
      setSyncingBackend(true);
      toast.loading('Signing you in...', { id: toastId });

      // Get reCAPTCHA token
      let recaptchaToken;
      try {
        recaptchaToken = await getToken(RECAPTCHA_ACTIONS.LOGIN);
      } catch {
        // reCAPTCHA is non-critical, continue without it
      }

      const payload = {
        firebaseToken: token,
        email: user.email,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
        recaptchaToken
      };

      // API layer handles retries automatically (2 retries with backoff)
      const response = await authAPI.firebaseLogin(payload);

      if (response.data?.user) {
        // Security: email must match (if email-based auth)
        if (user.email && response.data.user.email && response.data.user.email !== user.email) {
          toast.error('Account mismatch detected. Please contact support.', { id: toastId });
          return;
        }

        // Store token and update context
        if (response.data.accessToken) {
          Cookies.set('accessToken', response.data.accessToken, { expires: 1 });
        }
        updateUser(response.data.user);
        toast.success(`Welcome back, ${response.data.user.name || user.email || 'User'}!`, { id: toastId });
        router.push('/');
      } else {
        toast.error('Unexpected server response. Please try again.', { id: toastId });
      }
    } catch (error) {
      console.error('Backend sync error:', {
        status: error.response?.status,
        message: error.message,
        code: error.code,
      });

      // Firebase UID mismatch (security)
      if (error.response?.data?.error === 'FIREBASE_UID_MISMATCH') {
        toast.error(
          'This email is already linked to another account. Please contact support.',
          { id: toastId, duration: 6000 }
        );
        return;
      }

      // Show user-friendly error
      toast.error(getFriendlyError(error), { id: toastId, duration: 5000 });
    } finally {
      setSyncingBackend(false);
      setLoginInProgress(false);
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setLoginInProgress(true); // Prevent AuthContext from double-syncing

    try {
      const result = await loginWithGoogle();

      if (!result) {
        toast.error('No response from Google. Please try again.');
        setGoogleLoading(false);
        setLoginInProgress(false);
        return;
      }

      if (!result.success) {
        // User cancelled the popup — don't show an error
        if (result.code === 'auth/popup-closed-by-user' || result.code === 'auth/cancelled-popup-request') {
          setGoogleLoading(false);
          setLoginInProgress(false);
          return;
        }
        toast.error(result.error || 'Google sign-in failed');
        setGoogleLoading(false);
        setLoginInProgress(false);
        return;
      }

      if (!result.token) {
        toast.error('Failed to get authentication token from Google');
        setGoogleLoading(false);
        setLoginInProgress(false);
        return;
      }

      // handleFirebaseSuccess resets loginInProgress in its finally block
      await handleFirebaseSuccess(result);
    } catch (error) {
      console.error('Google sign-in exception:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setLoginInProgress(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F5F1' }}>
      {/* ═══ LEFT — Brand Image Panel ═══ */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&h=1600&fit=crop&q=80"
          alt="Radeo handcrafted leather"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26,23,20,0.35) 0%, rgba(26,23,20,0.72) 100%)' }} />
        {/* Brand content */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, letterSpacing: '0.18em', color: '#F0EBE1', textDecoration: 'none' }}>
            RADEO
          </Link>
          <div>
            <p style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontStyle: 'italic', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', lineHeight: 1.5, color: '#E8E0D0', maxWidth: '380px' }}>
              &ldquo;Where tradition meets the modern step.&rdquo;
            </p>
            <div className="mt-6" style={{ width: '40px', height: '1px', background: '#B8973A' }} />
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Form Panel ═══ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px]">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, letterSpacing: '0.18em', color: '#1A1714', textDecoration: 'none' }}>
              RADEO
            </Link>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <p className="mb-2 uppercase" style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', letterSpacing: '0.25em', color: '#8A7E74' }}>
              Welcome back
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 400, lineHeight: 1.1, color: '#1A1714' }}>
              Sign in to your account
            </h1>
          </div>

          {/* ── Underline Tab Switcher ── */}
          <div className="flex gap-8 mb-8" style={{ borderBottom: '1px solid #E5E2DC' }}>
            <button
              onClick={() => setAuthMethod('email')}
              className="relative pb-3 flex items-center gap-2 transition-colors"
              style={{
                fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: authMethod === 'email' ? '#1A1714' : '#8A7E74',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <FiMail className="w-4 h-4" />
              Email
              {authMethod === 'email' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#B8973A', transition: 'all 200ms ease' }} />
              )}
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className="relative pb-3 flex items-center gap-2 transition-colors"
              style={{
                fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: authMethod === 'phone' ? '#1A1714' : '#8A7E74',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <FiPhone className="w-4 h-4" />
              Phone
              {authMethod === 'phone' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#B8973A', transition: 'all 200ms ease' }} />
              )}
            </button>
          </div>

          {/* ── Auth Form Content ── */}
          {authMethod === 'email' ? (
            <EmailAuth onSuccess={handleFirebaseSuccess} mode="login" />
          ) : (
            <PhoneAuth onSuccess={handleFirebaseSuccess} />
          )}

          {/* ── Divider ── */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ height: '1px', background: '#E5E2DC' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4" style={{ background: '#F7F5F1', fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A7E74' }}>or</span>
            </div>
          </div>

          {/* ── Google Sign-In Button ── */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || syncingBackend}
            className="w-full flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              height: '48px',
              border: '1px solid #D4CFC9',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
              fontSize: '14px',
              color: '#1A1714',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8973A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D4CFC9'; }}
          >
            {syncingBackend ? (
              <div className="w-5 h-5 border-2 border-[#D4CFC9] border-t-[#B8973A] rounded-full animate-spin" />
            ) : (
              <FcGoogle className="w-5 h-5" />
            )}
            <span>
              {syncingBackend ? 'Connecting...' : googleLoading ? 'Opening Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* ── Footer ── */}
          <div className="mt-10 text-center">
            <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '12px', color: '#8A7E74', lineHeight: 1.6 }}>
              By continuing, you agree to our{' '}
              <Link href="/terms" style={{ color: '#B8973A', textDecoration: 'none' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" style={{ color: '#B8973A', textDecoration: 'none' }}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
