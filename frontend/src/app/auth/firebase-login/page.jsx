'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiMail, FiPhone } from 'react-icons/fi';
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-brand-cream/20 to-primary-100 pt-6">
      <div className="container-custom py-12">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-brand-brown mb-8">
            <FiArrowLeft />
            Back to Home
          </Link>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Auth Method Tabs */}
            <div className="grid grid-cols-2 border-b border-primary-200">
              <button
                onClick={() => setAuthMethod('email')}
                className={`
                  py-4 px-6 font-medium text-sm transition-all flex items-center justify-center gap-2
                  ${authMethod === 'email'
                    ? 'bg-brand-brown text-white'
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }
                `}
              >
                <FiMail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => setAuthMethod('phone')}
                className={`
                  py-4 px-6 font-medium text-sm transition-all flex items-center justify-center gap-2
                  ${authMethod === 'phone'
                    ? 'bg-brand-brown text-white'
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }
                `}
              >
                <FiPhone className="w-4 h-4" />
                Phone
              </button>
            </div>

            {/* Auth Components */}
            <div className="p-8">
              {authMethod === 'email' ? (
                <EmailAuth onSuccess={handleFirebaseSuccess} mode="login" />
              ) : (
                <PhoneAuth onSuccess={handleFirebaseSuccess} />
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-primary-500">OR</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || syncingBackend}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-primary-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncingBackend ? (
                  <div className="w-5 h-5 border-2 border-primary-300 border-t-brand-brown rounded-full animate-spin" />
                ) : (
                  <FcGoogle className="w-5 h-5" />
                )}
                <span className="font-medium text-primary-900">
                  {syncingBackend ? 'Connecting...' : googleLoading ? 'Opening Google...' : 'Continue with Google'}
                </span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-primary-500">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-brand-brown hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-brown hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
