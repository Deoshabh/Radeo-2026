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
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-background)]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-3xl">

        {/* Page heading */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-primary-900 mb-12 tracking-tight">
          My Profile
        </h1>

        {/* Profile Information */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="label-upper text-primary-400">Personal Details</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="label-upper text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-hover)] transition-colors duration-150 flex items-center gap-2"
              >
                <FiEdit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-6">
              <div className="group">
                <label className="label-upper block mb-2 text-primary-400">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="input-underline w-full"
                  required
                />
              </div>

              <div className="group">
                <label className="label-upper block mb-2 text-primary-400">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input-underline w-full opacity-50"
                />
                <p className="text-xs text-primary-400 mt-2 italic">Email cannot be changed</p>
              </div>

              <div className="group">
                <label className="label-upper block mb-2 text-primary-400">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="input-underline w-full"
                />
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="btn btn-primary flex items-center gap-2">
                    <FiSave className="w-4 h-4" /> Save
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
                    <FiX className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <hr className="divider mb-12" />

        {/* Change Password - Only for Firebase Auth users (not OAuth) who can change password */}
        {['password', 'local'].includes(user?.authProvider) && (
          <>
            <div className="mb-12">
              <ChangePassword />
            </div>
            <hr className="divider mb-12" />
          </>
        )}

        {/* Addresses */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="label-upper text-primary-400">Saved Addresses</h2>
            <button
              onClick={() => {
                setShowAddressForm(true);
                setEditingAddressId(null);
                resetAddressForm();
              }}
              className="label-upper text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-hover)] transition-colors duration-150 flex items-center gap-2"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>

          {/* Address Form */}
          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="mb-8 p-6 border border-[color:var(--color-border)] bg-white">
              <h3 className="font-serif text-lg font-medium text-primary-900 mb-6">
                {editingAddressId ? 'Edit Address' : 'New Address'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <label className="label-upper block mb-2 text-primary-400">Full Name</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="input-underline w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label-upper block mb-2 text-primary-400">Phone</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="input-underline w-full"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label-upper block mb-2 text-primary-400">Address Line 1</label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="input-underline w-full"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label-upper block mb-2 text-primary-400">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    className="input-underline w-full"
                  />
                </div>
                <div>
                  <label className="label-upper block mb-2 text-primary-400">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="input-underline w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label-upper block mb-2 text-primary-400">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="input-underline w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label-upper block mb-2 text-primary-400">Pin Code</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="input-underline w-full"
                    required
                    maxLength="6"
                    pattern="[0-9]{6}"
                    title="Please enter a valid 6-digit PIN code"
                  />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-all duration-150 ${addressForm.isDefault ? 'bg-[color:var(--color-accent)] border-[color:var(--color-accent)]' : 'border-primary-300 group-hover:border-[color:var(--color-accent)]'}`}>
                      {addressForm.isDefault && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="hidden"
                    />
                    <span className="text-sm text-primary-600">Set as default</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="submit" className="btn btn-primary">
                  {editingAddressId ? 'Update' : 'Save'} Address
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
              <div className="py-12 text-center border border-dashed border-primary-200">
                <FiMapPin className="w-8 h-8 text-primary-300 mx-auto mb-3" />
                <p className="text-primary-500 text-sm">No addresses saved yet</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address._id}
                  className={`group relative border transition-all duration-150 p-5 ${
                    address.isDefault
                      ? 'border-l-[3px] border-l-[color:var(--color-accent)] border-t-[color:var(--color-border)] border-r-[color:var(--color-border)] border-b-[color:var(--color-border)] bg-[color:var(--color-warm-bg)]'
                      : 'border-[color:var(--color-border)] hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-serif text-lg font-medium text-primary-900">{address.fullName}</span>
                        {address.isDefault && (
                          <span className="label-upper text-[10px] text-[color:var(--color-accent)]">Default</span>
                        )}
                      </div>
                      <p className="text-primary-600 text-sm leading-relaxed">{address.addressLine1}</p>
                      {address.addressLine2 && <p className="text-primary-600 text-sm">{address.addressLine2}</p>}
                      <p className="text-primary-600 text-sm">
                        {address.city}, {address.state} — {address.postalCode}
                      </p>
                      <p className="text-primary-400 text-xs mt-2 font-mono">{address.phone}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-primary-400 hover:text-[color:var(--color-accent)] transition-colors duration-150"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="p-2 text-primary-400 hover:text-red-500 transition-colors duration-150"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
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
