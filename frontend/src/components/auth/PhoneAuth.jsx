'use client';

import { useState, useEffect } from 'react';
import { FiPhone, FiHash, FiShield } from 'react-icons/fi';
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

  // Phone Number Input Step
  if (step === 'phone') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Sign In with Phone</h2>
          <p className="text-primary-600">Enter your phone number to receive an OTP</p>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-primary-900 mb-2">
              Phone Number
            </label>
            
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="input w-24"
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
              <div className="relative flex-1">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={10}
                  className="input pl-10"
                  placeholder="9876543210"
                />
              </div>
            </div>
            
            <p className="text-xs text-primary-500 mt-1">
              Enter phone number without country code
            </p>
          </div>

          {/* reCAPTCHA Container */}
          <div id="recaptcha-container" className="flex justify-center"></div>

          <div className="bg-primary-50 rounded-lg p-4 flex items-start gap-3">
            <FiShield className="w-5 h-5 text-brand-brown flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-700">
              <p className="font-medium mb-1">Secure Authentication</p>
              <p className="text-xs">
                We&apos;ll send a 6-digit OTP to verify your phone number. Standard SMS charges may apply.
              </p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    );
  }

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Verify OTP</h2>
          <p className="text-primary-600">
            Enter the 6-digit code sent to
          </p>
          <p className="text-brand-brown font-medium">
            {countryCode} {phoneNumber}
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-primary-900 mb-2">
              Enter OTP
            </label>
            <div className="relative">
              <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6}
                className="input pl-10 text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn btn-primary">
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </form>

        <div className="space-y-3">
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-primary-600">
                Resend OTP in <span className="font-medium text-brand-brown">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-brand-brown hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={handleChangeNumber}
              className="text-sm text-primary-600 hover:underline"
            >
              Change phone number
            </button>
          </div>
        </div>

        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <p className="text-xs text-primary-600">
            Didn&apos;t receive the OTP? Check your SMS inbox or try resending after the cooldown period.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
