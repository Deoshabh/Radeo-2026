'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { userAPI, addressAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiSave, FiX, FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';
import ChangePassword from '@/components/profile/ChangePassword';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAll();
      // Backend returns array directly, not wrapped
      const addressesData = Array.isArray(response.data) ? response.data : (response.data.addresses || []);
      setAddresses(addressesData);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await addressAPI.update(editingAddressId, addressForm);
        toast.success('Address updated successfully!');
      } else {
        await addressAPI.create(addressForm);
        toast.success('Address added successfully!');
      }
      fetchAddresses();
      setShowAddressForm(false);
      setEditingAddressId(null);
      resetAddressForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await addressAPI.delete(addressId);
        toast.success('Address deleted successfully!');
        fetchAddresses();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete address');
      }
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address._id);
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-4xl">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-brand-brown hover:text-[color:var(--color-muted)]"
              >
                <FiEdit2 /> Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 disabled:bg-primary-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg bg-primary-50 cursor-not-allowed"
                />
                <p className="text-xs text-primary-600 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 disabled:bg-primary-50 disabled:cursor-not-allowed"
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex items-center gap-2">
                    <FiSave /> Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                      });
                    }}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Change Password - Only for Firebase Auth users (not OAuth) who can change password */}
        {['password', 'local'].includes(user?.authProvider) && (
          <div className="mb-6">
            <ChangePassword />
          </div>
        )}

        {/* Addresses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary-900">Saved Addresses</h2>
            <button
              onClick={() => {
                setShowAddressForm(true);
                setEditingAddressId(null);
                resetAddressForm();
              }}
              className="flex items-center gap-2 text-brand-brown hover:text-[color:var(--color-muted)]"
            >
              <FiPlus /> Add New Address
            </button>
          </div>

          {/* Address Form */}
          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="mb-6 p-4 border border-primary-200 rounded-lg bg-primary-50">
              <h3 className="font-semibold text-primary-900 mb-4">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  required
                />
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="md:col-span-2 px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  required
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="md:col-span-2 px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  required
                />
                <input
                  type="text"
                  placeholder="Pin Code"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  className="px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  required
                  maxLength="6"
                  pattern="[0-9]{6}"
                  title="Please enter a valid 6-digit PIN code"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-primary-700">Set as default address</span>
                </label>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary">
                  {editingAddressId ? 'Update' : 'Add'} Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddressId(null);
                    resetAddressForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Address List */}
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-center text-primary-600 py-8">No addresses saved yet</p>
            ) : (
              addresses.map((address) => (
                <div key={address._id} className="border border-primary-200 rounded-lg p-4 hover:border-primary-400 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiMapPin className="text-brand-brown" />
                        <span className="font-semibold text-primary-900">{address.fullName}</span>
                        {address.isDefault && (
                          <span className="px-2 py-1 text-xs bg-brand-brown text-white rounded">Default</span>
                        )}
                      </div>
                      <p className="text-primary-700">{address.addressLine1}</p>
                      {address.addressLine2 && <p className="text-primary-700">{address.addressLine2}</p>}
                      <p className="text-primary-700">
                        {address.city}, {address.state} - {address.postalCode}
                      </p>
                      <p className="text-primary-600 text-sm mt-1">Phone: {address.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-primary-600 hover:text-brand-brown transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
