'use client';

import { useState } from 'react';
import { adminAPI } from '@/utils/api';
import { useUserHistory } from '@/hooks/useAdmin';
import { formatPrice } from '@/utils/helpers';
import toast from 'react-hot-toast';
import {
  FiX, FiMail, FiPhone, FiMapPin, FiShield, FiCalendar,
  FiShoppingBag, FiHeart, FiDollarSign, FiLock, FiLogOut,
  FiChevronDown, FiChevronUp, FiUser, FiPackage, FiTag,
  FiAlertTriangle, FiCheck, FiClock
} from 'react-icons/fi';

export default function UserDrawer({ userId, isOpen, onClose, onRefresh }) {
  const { data: history, isLoading: loading } = useUserHistory(isOpen ? userId : null);
  const [sections, setSections] = useState({
    overview: true,
    orders: true,
    addresses: false,
    activity: false,
  });
  const [actionLoading, setActionLoading] = useState(null);

  const toggleSection = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordReset = async () => {
    if (!confirm('Send a password reset email to this user?')) return;
    try {
      setActionLoading('reset');
      await adminAPI.sendPasswordReset(userId);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceLogout = async () => {
    if (!confirm('Force logout all sessions for this user?')) return;
    try {
      setActionLoading('logout');
      await adminAPI.forceLogout(userId);
      toast.success('User logged out from all sessions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to force logout');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async () => {
    if (!confirm('Impersonate this user? You will get a temporary token valid for 5 minutes.')) return;
    try {
      setActionLoading('impersonate');
      const response = await adminAPI.impersonateUser(userId);
      const { impersonationToken, expiresIn, targetUser } = response.data;
      toast.success(`Impersonation token generated for ${targetUser?.name || 'user'} (expires in ${expiresIn}s). Token copied to clipboard.`);
      // Token available in response.data.impersonationToken — do not log to console
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to impersonate (requires superadmin role)');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const user = history?.user;
  const stats = history?.statistics;
  const orders = history?.orders || [];
  const addresses = history?.addresses || [];

  const SectionHeader = ({ title, icon: Icon, sectionKey }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-3 px-1 text-left"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-primary-800">
        <Icon className="w-4 h-4 text-brand-brown" />
        {title}
      </div>
      {sections[sectionKey] ? <FiChevronUp className="w-4 h-4 text-primary-400" /> : <FiChevronDown className="w-4 h-4 text-primary-400" />}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-100">
          <h2 className="text-lg font-bold text-primary-900">User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-primary-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900" />
            </div>
          ) : !user ? (
            <p className="text-center text-primary-500 py-8">User not found</p>
          ) : (
            <>
              {/* User Header Card */}
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-primary-900 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-primary-900 truncate">{user.name}</h3>
                  <p className="text-sm text-primary-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-600'
                    }`}>
                      <FiShield className="w-3 h-3" /> {user.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    {user.authProvider && user.authProvider !== 'local' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 capitalize">
                        {user.authProvider}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handlePasswordReset}
                  disabled={actionLoading === 'reset'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  <FiLock className="w-3.5 h-3.5" />
                  {actionLoading === 'reset' ? 'Sending…' : 'Reset Password'}
                </button>
                <button
                  onClick={handleForceLogout}
                  disabled={actionLoading === 'logout'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                  {actionLoading === 'logout' ? 'Logging out…' : 'Force Logout'}
                </button>
              </div>
              <button
                onClick={handleImpersonate}
                disabled={actionLoading === 'impersonate'}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <FiUser className="w-3.5 h-3.5" />
                {actionLoading === 'impersonate' ? 'Generating token…' : 'Impersonate User'}
              </button>

              {/* Overview Stats */}
              <div>
                <SectionHeader title="Overview" icon={FiUser} sectionKey="overview" />
                {sections.overview && stats && (
                  <div className="grid grid-cols-2 gap-3 pb-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">Total Orders</p>
                      <p className="text-lg font-bold text-blue-900">{stats.totalOrders || 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600">Total Spent</p>
                      <p className="text-lg font-bold text-green-900">{formatPrice(stats.totalSpent || 0)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600">Completed</p>
                      <p className="text-lg font-bold text-purple-900">{stats.completedOrders || 0}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-amber-600">Coupons Used</p>
                      <p className="text-lg font-bold text-amber-900">{stats.couponsUsed || 0}</p>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-lg col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-primary-500">Joined</p>
                          <p className="text-sm font-medium text-primary-800">
                            {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-primary-500">Avg Order</p>
                          <p className="text-sm font-medium text-primary-800">
                            {stats.totalOrders ? formatPrice(Math.round(stats.totalSpent / stats.totalOrders)) : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="border-t border-primary-100">
                <SectionHeader title={`Recent Orders (${orders.length})`} icon={FiShoppingBag} sectionKey="orders" />
                {sections.orders && (
                  <div className="space-y-2 pb-3 max-h-64 overflow-y-auto">
                    {orders.length === 0 ? (
                      <p className="text-sm text-primary-400 py-2">No orders yet</p>
                    ) : (
                      orders.slice(0, 10).map(order => (
                        <div key={order._id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-primary-800">#{order.orderNumber || order._id.slice(-6)}</p>
                            <p className="text-xs text-primary-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items?.length || 0} items
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-primary-900">{formatPrice(order.total || 0)}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Addresses */}
              <div className="border-t border-primary-100">
                <SectionHeader title={`Addresses (${addresses.length})`} icon={FiMapPin} sectionKey="addresses" />
                {sections.addresses && (
                  <div className="space-y-2 pb-3">
                    {addresses.length === 0 ? (
                      <p className="text-sm text-primary-400 py-2">No addresses saved</p>
                    ) : (
                      addresses.map((addr, i) => (
                        <div key={i} className="p-3 bg-primary-50 rounded-lg text-sm">
                          <p className="font-medium text-primary-800">{addr.fullName || user.name}</p>
                          <p className="text-primary-500 text-xs mt-0.5">
                            {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                          </p>
                          {addr.phone && <p className="text-xs text-primary-400 mt-0.5"><FiPhone className="w-3 h-3 inline mr-1" />{addr.phone}</p>}
                          {addr.isDefault && <span className="inline-block mt-1 text-xs bg-brand-brown/10 text-brand-brown px-2 py-0.5 rounded">Default</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Contact & Meta */}
              <div className="border-t border-primary-100">
                <SectionHeader title="Activity & Contact" icon={FiCalendar} sectionKey="activity" />
                {sections.activity && (
                  <div className="space-y-2 pb-3 text-sm">
                    {user.phone && (
                      <div className="flex items-center gap-2 text-primary-600">
                        <FiPhone className="w-4 h-4 text-primary-400" />
                        <span>{user.phone}</span>
                        {user.phoneVerified && <FiCheck className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-primary-600">
                      <FiMail className="w-4 h-4 text-primary-400" />
                      <span className="truncate">{user.email}</span>
                      {user.emailVerified && <FiCheck className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-2 text-primary-600">
                      <FiClock className="w-4 h-4 text-primary-400" />
                      <span>Last updated: {new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
