'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUsers, useUpdateUserRole, useToggleUserBlock } from '@/hooks/useAdmin';
import CreateAdminModal from '@/components/CreateAdminModal';
import UserDrawer from '@/components/admin/users/UserDrawer';
import {
  FiSearch, FiShield, FiUser, FiUserPlus, FiActivity,
  FiUsers, FiStar, FiAlertTriangle, FiClock, FiTrendingUp,
  FiChevronDown, FiRefreshCw
} from 'react-icons/fi';

// ── User Segments ──
const SEGMENTS = [
  { key: 'all', label: 'All Users', icon: FiUsers, color: 'primary' },
  { key: 'new', label: 'New (30d)', icon: FiClock, color: 'blue', filter: (u) => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return new Date(u.createdAt) >= d;
  }},
  { key: 'vip', label: 'VIP', icon: FiStar, color: 'amber', filter: (u) => (u.orderCount || 0) >= 5 || (u.totalSpent || 0) >= 10000 },
  { key: 'at-risk', label: 'At Risk', icon: FiAlertTriangle, color: 'red', filter: (u) => {
    const d = new Date(); d.setDate(d.getDate() - 90);
    return (u.orderCount || 0) >= 1 && (!u.lastOrderDate || new Date(u.lastOrderDate) < d);
  }},
  { key: 'blocked', label: 'Blocked', icon: FiShield, color: 'gray', filter: (u) => u.isBlocked || !u.isActive },
  { key: 'admin', label: 'Admins', icon: FiShield, color: 'yellow', filter: (u) => u.role === 'admin' },
];

function SegmentBadge({ count, color }) {
  const colors = {
    primary: 'bg-primary-100 text-primary-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-700',
  };
  return <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${colors[color]}`}>{count}</span>;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: usersData, isLoading: loadingUsers, refetch: fetchUsers } = useUsers();
  const users = usersData?.users || [];
  const updateRoleMut = useUpdateUserRole();
  const toggleBlockMut = useToggleUserBlock();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [drawerUserId, setDrawerUserId] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const adminCount = users.filter(u => u.role === 'admin').length;

  const handleUpdateRole = (userId, newRole) => updateRoleMut.mutate({ userId, role: newRole });

  const handleToggleStatus = (userId) => toggleBlockMut.mutate(userId);

  // ── Segment counts ──
  const segmentCounts = useMemo(() => {
    const counts = {};
    SEGMENTS.forEach(s => {
      counts[s.key] = s.key === 'all' ? users.length : users.filter(s.filter).length;
    });
    return counts;
  }, [users]);

  // ── Filtered + sorted ──
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Segment filter
    const seg = SEGMENTS.find(s => s.key === activeSegment);
    if (seg?.filter) result = result.filter(seg.filter);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === 'createdAt' || sortField === 'lastOrderDate') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });

    return result;
  }, [users, activeSegment, searchQuery, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-xs opacity-50">{sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  );

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Users</h1>
            <p className="text-sm text-primary-500 mt-1">{users.length} total users · {segmentCounts.admin} admins</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium"
              title="Create admin"
            >
              <FiUserPlus className="w-4 h-4" />
              Create Admin
            </button>
          </div>
        </div>

        {/* Segment Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {SEGMENTS.map(seg => {
            const Icon = seg.icon;
            const active = activeSegment === seg.key;
            return (
              <button
                key={seg.key}
                onClick={() => setActiveSegment(seg.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-primary-900 text-white' : 'bg-white border border-primary-200 text-primary-700 hover:bg-primary-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {seg.label}
                <SegmentBadge count={segmentCounts[seg.key]} color={active ? 'primary' : seg.color} />
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-3 mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md border border-primary-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50 border-b border-primary-200 text-left">
                  <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('name')}>
                    User<SortIcon field="name" />
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary-700">Provider</th>
                  <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    Joined<SortIcon field="createdAt" />
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary-700">Role</th>
                  <th className="px-4 py-3 font-semibold text-primary-700 text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-primary-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-primary-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-primary-50 transition-colors cursor-pointer"
                      onClick={() => setDrawerUserId(u._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-900 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {u.profilePicture ? (
                              <img src={u.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              u.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-primary-900 truncate">{u.name}</p>
                            <p className="text-xs text-primary-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-600 capitalize">
                          {u.authProvider || 'local'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary-600">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                          className="px-2 py-1 rounded border border-primary-200 bg-white text-primary-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            u.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Blocked'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDrawerUserId(u._id); }}
                          className="p-1.5 text-primary-500 hover:bg-primary-100 rounded-lg transition-colors"
                          title="View profile"
                        >
                          <FiActivity className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border border-primary-200 p-4">
            <div className="flex items-center gap-2 text-primary-500 text-xs mb-1"><FiUsers className="w-4 h-4" /> Total</div>
            <p className="text-2xl font-bold text-primary-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-primary-200 p-4">
            <div className="flex items-center gap-2 text-yellow-600 text-xs mb-1"><FiShield className="w-4 h-4" /> Admins</div>
            <p className="text-2xl font-bold text-yellow-700">{segmentCounts.admin}</p>
          </div>
          <div className="bg-white rounded-lg border border-primary-200 p-4">
            <div className="flex items-center gap-2 text-green-600 text-xs mb-1"><FiActivity className="w-4 h-4" /> Active</div>
            <p className="text-2xl font-bold text-green-700">{users.filter(u => u.isActive).length}</p>
          </div>
          <div className="bg-white rounded-lg border border-primary-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 text-xs mb-1"><FiClock className="w-4 h-4" /> New (30d)</div>
            <p className="text-2xl font-bold text-blue-700">{segmentCounts.new}</p>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => setShowCreateAdminModal(false)}
        onSuccess={() => { fetchUsers(); setShowCreateAdminModal(false); }}
        currentAdminCount={adminCount}
      />

      {/* User Profile Drawer */}
      <UserDrawer
        userId={drawerUserId}
        isOpen={!!drawerUserId}
        onClose={() => setDrawerUserId(null)}
        onRefresh={fetchUsers}
      />
    </div>
  );
}
