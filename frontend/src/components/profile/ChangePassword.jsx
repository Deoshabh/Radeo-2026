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
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="label-upper text-primary-400">Change Password</h2>
                <button
                    onClick={handleReset}
                    type="button"
                    className="label-upper text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-hover)] transition-colors duration-150"
                >
                    Forgot Password?
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
                <div>
                    <label className="label-upper block mb-2 text-primary-400">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="input-underline w-full"
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="label-upper block mb-2 text-primary-400">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="input-underline w-full"
                        required
                        minLength={6}
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
