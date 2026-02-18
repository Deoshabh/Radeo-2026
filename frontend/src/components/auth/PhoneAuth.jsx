'use client';

import { useState, useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import { setupRecaptcha, sendOTP, verifyOTP } from '@/utils/firebaseAuth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Phone Authentication Component
 * Supports OTP-based phone authentication
 */
export default function PhoneAuth({ onSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default to India
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const { setLoginInProgress } = useAuth();

  // Setup reCAPTCHA on component mount
  useEffect(() => {
    const verifier = setupRecaptcha('recaptcha-container');
    
    return () => {
      // Cleanup reCAPTCHA on unmount
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Timer for resend OTP cooldown
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    const result = await sendOTP(fullPhoneNumber);

    if (result.success) {
      setConfirmationResult(result.confirmationResult);
      setStep('otp');
      setTimer(60); // 60 seconds cooldown
    } else {
      // Reset reCAPTCHA on error
      const verifier = setupRecaptcha('recaptcha-container');
    }

    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setLoginInProgress(true); // Prevent AuthContext from double-syncing

    const result = await verifyOTP(confirmationResult, otp);

    if (result.success) {
      if (onSuccess) {
        onSuccess(result);
        // handleFirebaseSuccess resets loginInProgress in its finally block
      }
    } else {
      setLoginInProgress(false);
    }

    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      toast.error(`Please wait ${timer} seconds before resending`);
      return;
    }

    setOtp(''); // Clear OTP input
    setLoading(true);

    // Reset reCAPTCHA
    const verifier = setupRecaptcha('recaptcha-container');

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    const result = await sendOTP(fullPhoneNumber);

    if (result.success) {
      setConfirmationResult(result.confirmationResult);
      setTimer(60);
    }

    setLoading(false);
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
    // Reset reCAPTCHA
    setupRecaptcha('recaptcha-container');
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

  // Phone Number Input Step
  if (step === 'phone') {
    return (
      <div>
        <form onSubmit={handleSendOTP} className="space-y-6">
          <div>
            <label htmlFor="phone" style={labelStyle}>Phone Number</label>
            <div className="flex gap-3 items-end">
              {/* Country Code Selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  ...inputStyle,
                  width: '90px',
                  cursor: 'pointer',
                  appearance: 'none',
                  paddingRight: '4px',
                }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+65">🇸🇬 +65</option>
              </select>

              {/* Phone Number Input */}
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={10}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="9876543210"
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>
            <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', color: '#A09890', marginTop: '6px' }}>
              Enter phone number without country code
            </p>
          </div>

          {/* reCAPTCHA Container */}
          <div id="recaptcha-container" className="flex justify-center"></div>

          <div className="flex items-start gap-3 py-3 px-4" style={{ background: '#F0EBE1', borderLeft: '2px solid #B8973A' }}>
            <FiShield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B8973A' }} />
            <div>
              <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '12px', fontWeight: 500, color: '#1A1714', marginBottom: '2px' }}>Secure Authentication</p>
              <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', color: '#8A7E74' }}>
                We&apos;ll send a 6-digit OTP to verify your phone number. Standard SMS charges may apply.
              </p>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2C2420'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1714'; }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    );
  }

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div>
        <div className="text-center mb-6">
          <h2 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)", fontSize: '1.6rem', fontWeight: 400, color: '#1A1714', marginBottom: '4px' }}>Verify OTP</h2>
          <p style={subtextStyle}>Enter the 6-digit code sent to</p>
          <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '14px', fontWeight: 500, color: '#B8973A' }}>
            {countryCode} {phoneNumber}
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label htmlFor="otp" style={labelStyle}>Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              maxLength={6}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '0.5em', fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
              placeholder="000000"
              autoComplete="one-time-code"
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>

          <button
            type="submit" disabled={loading || otp.length !== 6}
            style={{ ...primaryBtnStyle, opacity: (loading || otp.length !== 6) ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading && otp.length === 6) e.currentTarget.style.background = '#2C2420'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1714'; }}
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </form>

        <div className="space-y-3 mt-6">
          <div className="text-center">
            {timer > 0 ? (
              <p style={subtextStyle}>
                Resend OTP in <span style={{ color: '#B8973A', fontWeight: 500 }}>{timer}s</span>
              </p>
            ) : (
              <button onClick={handleResendOTP} disabled={loading} style={{ ...linkBtnStyle, fontWeight: 500 }}>
                Resend OTP
              </button>
            )}
          </div>
          <div className="text-center">
            <button onClick={handleChangeNumber} style={{ ...linkBtnStyle, color: '#8A7E74' }}>
              Change phone number
            </button>
          </div>
        </div>

        <div className="mt-6 py-3 px-4 text-center" style={{ background: '#F0EBE1' }}>
          <p style={{ fontFamily: "var(--font-inter, 'DM Sans', sans-serif)", fontSize: '11px', color: '#8A7E74' }}>
            Didn&apos;t receive the OTP? Check your SMS inbox or try resending after the cooldown period.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
