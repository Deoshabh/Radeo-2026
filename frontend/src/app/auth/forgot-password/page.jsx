'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/utils/firebaseAuth';
import Link from 'next/link';
import { FiCheck } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    padding: '12px 0',
    fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
    fontSize: '15px',
    color: '#1A1714',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #D4CFC9',
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#F7F5F1' }}>
      <div className="w-full max-w-[420px]">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, letterSpacing: '0.18em', color: '#1A1714', textDecoration: 'none' }}>
            RADEO
          </Link>
        </div>

        <h2 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.8rem', fontWeight: 400, color: '#1A1714', marginBottom: '8px' }}>
          Forgot your password?
        </h2>
        <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '14px', color: '#8A7E74', lineHeight: 1.6, marginBottom: '32px' }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div>
            <div className="flex items-start gap-3 py-4 px-5 mb-6" style={{ background: '#F0EBE1', borderLeft: '2px solid #B8973A' }}>
              <FiCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#B8973A' }} />
              <div>
                <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '13px', fontWeight: 500, color: '#1A1714', marginBottom: '4px' }}>Reset link sent</p>
                <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '13px', color: '#8A7E74' }}>
                  Check your email for instructions to reset your password.
                </p>
              </div>
            </div>
            <div className="text-center">
              <Link href="/auth/login" style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '13px', color: '#B8973A', textDecoration: 'none' }}>
                Return to log in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email-address" style={labelStyle}>Email Address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                style={inputStyle}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                onFocus={(e) => { e.target.style.borderBottomColor = '#B8973A'; }}
                onBlur={(e) => { e.target.style.borderBottomColor = '#D4CFC9'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '52px',
                fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                background: loading ? '#8A7E74' : '#1A1714',
                color: '#F0EBE1',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2C2420'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#1A1714'; }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link href="/auth/login" style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '13px', color: '#B8973A', textDecoration: 'none' }}>
                Back to log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
