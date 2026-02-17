'use client';

import { useState } from 'react';
import { updateUserPassword, resetPassword } from '@/utils/firebaseAuth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ChangePassword() {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserPassword(passwords.newPassword);
            if (result.success) {
                setPasswords({ newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Change password error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!user?.email) return;
        const loadingToast = toast.loading('Sending reset link...');
        try {
            const result = await resetPassword(user.email);
            toast.dismiss(loadingToast);
            if (result.success) {
                toast.success("Password reset link sent to " + user.email);
            } else {
                toast.error(result.error || "Failed to send reset link");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error(error);
            toast.error("Failed to send reset link");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary-900">Change Password</h2>
                <button
                    onClick={handleReset}
                    type="button"
                    className="text-sm text-brand-brown hover:text-[color:var(--color-muted)] underline"
                >
                    Forgot Password?
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                        required
                        minLength={6}
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn btn-primary w-full sm:w-auto ${loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
