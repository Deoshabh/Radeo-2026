'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { resetPassword } from '@/utils/firebaseAuth';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
      <div className="container-custom py-12">
        <div className="max-w-md mx-auto">
          <Link href="/auth/firebase-login" className="inline-flex items-center gap-2 text-primary-600 hover:text-brand-brown mb-8">
            <FiArrowLeft />
            Back to Login
          </Link>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="font-serif text-3xl font-bold text-primary-900 mb-2">Reset Password</h1>
            <p className="text-primary-600 mb-8">Enter your email to receive a password reset link.</p>

            {submitted ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <p className="font-medium mb-1">Email Sent!</p>
                  <p className="text-sm">Check your inbox for a password reset link from Firebase.</p>
                </div>
                <Link 
                  href="/auth/firebase-login" 
                  className="block w-full text-center btn btn-primary"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                  <p className="text-xs text-primary-500 mt-2">
                    We&apos;ll send you a secure link to reset your password
                  </p>
                </div>

                <button type="submit" disabled={loading} className="w-full btn btn-primary">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
