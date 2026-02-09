'use client';

import { useState } from 'react';
import { FiMail, FiLock, FiUser, FiCheck } from 'react-icons/fi';
import { loginWithEmail, registerWithEmail, resetPassword, resendVerificationEmail } from '@/utils/firebaseAuth';
import toast from 'react-hot-toast';

/**
 * Email Authentication Component
 * Supports login, registration, and password reset
 */
export default function EmailAuth({ onSuccess, mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'reset', 'verify'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await loginWithEmail(formData.email, formData.password);
    
    if (result.success) {
      if (onSuccess) {
        onSuccess(result);
      }
    } else if (result.needsVerification) {
      setMode('verify');
    }
    
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await registerWithEmail(
      formData.email,
      formData.password,
      formData.displayName
    );
    
    if (result.success) {
      setMode('verify');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await resetPassword(formData.email);
    
    if (result.success) {
      setMode('login');
    }
    
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    await resendVerificationEmail();
    setLoading(false);
  };

  // Login Form
  if (mode === 'login') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Sign In with Email</h2>
          <p className="text-primary-600">Enter your email and password</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-900 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMode('reset')}
            className="text-sm text-brand-brown hover:underline"
          >
            Forgot password?
          </button>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-primary-600">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setMode('register')}
              className="text-brand-brown hover:underline font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Register Form
  if (mode === 'register') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Create Account</h2>
          <p className="text-primary-600">Sign up with your email</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-primary-900 mb-2">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="input pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-900 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
            <p className="text-xs text-primary-500 mt-1">At least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-900 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-primary-600">
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-brand-brown hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Reset Password Form
  if (mode === 'reset') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Reset Password</h2>
          <p className="text-primary-600">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setMode('login')}
            className="text-sm text-brand-brown hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Email Verification Notice
  if (mode === 'verify') {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FiCheck className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Verify Your Email</h2>
          <p className="text-primary-600">
            We&apos;ve sent a verification link to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-primary-500 mt-2">
            Please check your email and click the verification link to continue.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full btn btn-secondary"
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <button
            onClick={() => setMode('login')}
            className="w-full text-brand-brown hover:underline"
          >
            Already verified? Sign In
          </button>
        </div>
      </div>
    );
  }

  return null;
}
