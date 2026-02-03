'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import { FiSearch, FiMail, FiPhone, FiShield, FiUser } from 'react-icons/fi';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isAuthenticated, loading, router]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminAPI.getAllUsers();
      // Backend returns {users: [...]}
      console.log('📦 Admin Users API response:', response.data);
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const handleUpdateRole = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserBlock(userId);
      toast.success('User status updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Users Management</h1>
          <p className="text-sm sm:text-base text-primary-600 mt-1">Manage user accounts and permissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'user', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors touch-manipulation ${
                    filterRole === role
                      ? 'bg-primary-900 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Role</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-primary-600">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-900 text-white flex items-center justify-center font-semibold">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-primary-900">{u.name}</p>
                            <p className="text-sm text-primary-600">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-primary-700 flex items-center gap-2">
                            <FiMail className="w-4 h-4" /> {u.email}
                          </p>
                          {u.phone && (
                            <p className="text-sm text-primary-700 flex items-center gap-2">
                              <FiPhone className="w-4 h-4" /> {u.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-primary-700">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-primary-900 ${
                            u.role === 'admin'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            u.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-primary-600 text-sm mb-1">Total Users</p>
            <p className="text-2xl font-bold text-primary-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-primary-600 text-sm mb-1">Admin Users</p>
            <p className="text-2xl font-bold text-yellow-600">
              {users.filter((u) => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-primary-600 text-sm mb-1">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
