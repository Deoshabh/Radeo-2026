'use client';

import { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { loginWithEmail, registerWithEmail, resetPassword, resendVerificationEmail } from '@/utils/firebaseAuth';
import { useAuth } from '@/context/AuthContext';
import { useRecaptcha, RECAPTCHA_ACTIONS } from '@/utils/turnstile';
import toast from 'react-hot-toast';

/**
 * Email Authentication Component
 * Supports login, registration, and password reset
 */
export default function EmailAuth({ onSuccess, mode: initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'reset', 'verify'
  const [loading, setLoading] = useState(false);
  const { setLoginInProgress } = useAuth();
  const { getToken } = useRecaptcha();
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
    setLoginInProgress(true); // Prevent AuthContext from double-syncing

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getToken(RECAPTCHA_ACTIONS.LOGIN);

      const result = await loginWithEmail(formData.email, formData.password, recaptchaToken);

      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
          // handleFirebaseSuccess resets loginInProgress in its finally block
        }
      } else if (result.needsVerification) {
        setMode('verify');
        setLoginInProgress(false);
      } else {
        setLoginInProgress(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
      setLoginInProgress(false);
    } finally {
      setLoading(false);
    }
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

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getToken(RECAPTCHA_ACTIONS.REGISTER);

      const result = await registerWithEmail(
        formData.email,
        formData.password,
        formData.displayName,
        recaptchaToken
      );

      if (result.success) {
        setMode('verify');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getToken(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);

      const result = await resetPassword(formData.email, recaptchaToken);

      if (result.success) {
        setMode('login');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An error occurred while resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    await resendVerificationEmail();
    setLoading(false);
  };

  /* ── Shared inline styles ── */
  const labelStyle = {
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#8A7E74',
    display: 'block',
    marginBottom: '8px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 0 12px 0',
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '15px',
    color: '#1A1714',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #D4CFC9',
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  const inputFocusHandler = (e) => { e.target.style.borderBottomColor = '#B8973A'; };
  const inputBlurHandler = (e) => { e.target.style.borderBottomColor = '#D4CFC9'; };

  const primaryBtnStyle = {
    width: '100%',
    height: '52px',
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    background: '#1A1714',
    color: '#F0EBE1',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms ease',
  };

  const linkBtnStyle = {
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '13px',
    color: '#B8973A',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const subtextStyle = {
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '13px',
    color: '#8A7E74',
  };

  // Login Form
  if (mode === 'login') {
    return (
      <div className="animate-slide-up">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input
              type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
              style={inputStyle} placeholder="you@example.com"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              type="password" id="password" name="password" value={formData.password} onChange={handleChange} required
              style={inputStyle} placeholder="••••••••"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => setMode('reset')} style={linkBtnStyle}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2C2420'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1714'; }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p style={subtextStyle}>
            Don&apos;t have an account?{' '}
            <button onClick={() => setMode('register')} style={{ ...linkBtnStyle, fontWeight: 500 }}>
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
      <div className="animate-slide-up">
        <div className="mb-6">
          <h2 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, color: '#1A1714' }}>Create Account</h2>
          <p style={{ ...subtextStyle, marginTop: '4px' }}>Sign up with your email</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="displayName" style={labelStyle}>Full Name</label>
            <input
              type="text" id="displayName" name="displayName" value={formData.displayName} onChange={handleChange} required
              style={inputStyle} placeholder="John Doe"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input
              type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
              style={inputStyle} placeholder="you@example.com"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              type="password" id="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
              style={inputStyle} placeholder="••••••••"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
            <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', color: '#A09890', marginTop: '4px' }}>At least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
            <input
              type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
              style={inputStyle} placeholder="••••••••"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2C2420'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1714'; }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p style={subtextStyle}>
            Already have an account?{' '}
            <button onClick={() => setMode('login')} style={{ ...linkBtnStyle, fontWeight: 500 }}>
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
      <div className="animate-slide-up">
        <div className="mb-6">
          <h2 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, color: '#1A1714' }}>Reset Password</h2>
          <p style={{ ...subtextStyle, marginTop: '4px' }}>Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input
              type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
              style={inputStyle} placeholder="you@example.com"
              onFocus={inputFocusHandler} onBlur={inputBlurHandler}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2C2420'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1714'; }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => setMode('login')} style={linkBtnStyle}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Email Verification Notice
  if (mode === 'verify') {
    return (
      <div className="text-center animate-slide-up">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ background: '#F0EBE1', borderRadius: '50%' }}>
          <FiCheck className="w-7 h-7" style={{ color: '#B8973A' }} />
        </div>

        <h2 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, color: '#1A1714', marginBottom: '8px' }}>Verify Your Email</h2>
        <p style={subtextStyle}>
          We&apos;ve sent a verification link to <strong style={{ color: '#1A1714' }}>{formData.email}</strong>
        </p>
        <p style={{ ...subtextStyle, fontSize: '12px', marginTop: '8px' }}>
          Please check your email and click the verification link to continue.
        </p>

        <div className="space-y-3 mt-8">
          <button
            onClick={handleResendVerification} disabled={loading}
            style={{ ...primaryBtnStyle, background: 'transparent', color: '#1A1714', border: '1px solid #D4CFC9', opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = '#B8973A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D4CFC9'; }}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <button onClick={() => setMode('login')} style={{ ...linkBtnStyle, display: 'block', width: '100%', textAlign: 'center', marginTop: '12px' }}>
            Already verified? Sign In
          </button>
        </div>
      </div>
    );
  }

  return null;
}
