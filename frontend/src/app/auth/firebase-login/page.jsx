'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiMail, FiPhone } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import EmailAuth from '@/components/auth/EmailAuth';
import PhoneAuth from '@/components/auth/PhoneAuth';
import { authAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { loginWithGoogle } from '@/utils/firebaseAuth';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '@/utils/recaptcha';
import toast from 'react-hot-toast';

export default function FirebaseLoginPage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const { getToken } = useRecaptcha();
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [googleLoading, setGoogleLoading] = useState(false);

  /**
   * Handle successful Firebase authentication
   * Sync Firebase user with backend
   */
  const handleFirebaseSuccess = async (result) => {
    try {
      const { user, token } = result;

      // Get reCAPTCHA token for backend verification
      const recaptchaToken = await getToken(RECAPTCHA_ACTIONS.LOGIN);

      // Send Firebase token to backend to create/sync user session
      const response = await authAPI.firebaseLogin({
        firebaseToken: token,
        email: user.email,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
        recaptchaToken
      });

      // Update auth context with backend user data
      if (response.data?.user) {
        updateUser(response.data.user);
        toast.success('Authentication successful!');
        router.push('/');
      }
    } catch (error) {
      console.error('Backend sync error:', error);
      toast.error('Failed to sync with server. Please try again.');
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    const result = await loginWithGoogle();
    
    if (result.success) {
      await handleFirebaseSuccess(result);
    }
    
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-brand-cream/20 to-primary-100 pt-24">
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
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-primary-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="w-5 h-5" />
                <span className="font-medium text-primary-900">
                  {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
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
