'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

export default function FiltersPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterType, setFilterType] = useState('all');
  
  const [formData, setFormData] = useState({
    type: 'size',
    name: '',
    value: '',
    displayOrder: 0,
    isActive: true,
    minPrice: 0,
    maxPrice: null,
  });

  const filterTypes = [
    { value: 'all', label: 'All Filters' },
    { value: 'size', label: 'Size' },
    { value: 'color', label: 'Color' },
    { value: 'material', label: 'Material' },
    { value: 'priceRange', label: 'Price Range' },
  ];

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await adminAPI.getAllFilters(params);
      console.log('📦 Admin Filters API response:', response.data);
      setFilters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
      toast.error('Failed to load filters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchFilters();
  }, [user, router, filterType]);

  const handleOpenModal = (filter = null) => {
    if (filter) {
      setEditMode(true);
      setSelectedFilter(filter);
      setFormData({
        type: filter.type,
        name: filter.name,
        value: filter.value,
        displayOrder: filter.displayOrder || 0,
        isActive: filter.isActive,
        minPrice: filter.minPrice || 0,
        maxPrice: filter.maxPrice || null,
      });
    } else {
      setEditMode(false);
      setSelectedFilter(null);
      setFormData({
        type: filterType !== 'all' ? filterType : 'size',
        name: '',
        value: '',
        displayOrder: 0,
        isActive: true,
        minPrice: 0,
        maxPrice: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedFilter(null);
    setFormData({
      type: 'size',
      name: '',
      value: '',
      displayOrder: 0,
      isActive: true,
      minPrice: 0,
      maxPrice: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-generate value from name for non-priceRange types
    if (name === 'name' && formData.type !== 'priceRange' && !editMode) {
      const generatedValue = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData({ ...formData, name: value, value: generatedValue });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = { ...formData };
      
      // Convert price values to numbers for priceRange type
      if (formData.type === 'priceRange') {
        submitData.minPrice = Number(formData.minPrice) || 0;
        submitData.maxPrice = formData.maxPrice ? Number(formData.maxPrice) : null;
      }

      if (editMode) {
        await adminAPI.updateFilter(selectedFilter._id, submitData);
        toast.success('Filter updated successfully');
      } else {
        await adminAPI.createFilter(submitData);
        toast.success('Filter created successfully');
      }
      
      handleCloseModal();
      fetchFilters();
    } catch (error) {
      console.error('Failed to save filter:', error);
      toast.error(error.response?.data?.message || 'Failed to save filter');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    
    try {
      await adminAPI.deleteFilter(id);
      toast.success('Filter deleted successfully');
      fetchFilters();
    } catch (error) {
      console.error('Failed to delete filter:', error);
      toast.error(error.response?.data?.message || 'Failed to delete filter');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Group filters by type
  const groupedFilters = filters.reduce((acc, filter) => {
    if (!acc[filter.type]) {
      acc[filter.type] = [];
    }
    acc[filter.type].push(filter);
    return acc;
  }, {});

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Product Filters</h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1">Manage product filtering options</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary flex items-center gap-2 justify-center w-full sm:w-auto touch-manipulation"
          >
            <FiPlus />
            Add Filter
          </button>
        </div>

        {/* Filter Type Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filterTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === type.value
                  ? 'bg-primary-900 text-white'
                  : 'bg-white text-primary-700 hover:bg-primary-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Filters Display */}
        <div className="space-y-8">
          {filterType === 'all' ? (
            // Show filters grouped by type
            Object.entries(groupedFilters).map(([type, typeFilters]) => (
              <div key={type} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4 capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeFilters.map((filter) => (
                    <FilterCard
                      key={filter._id}
                      filter={filter}
                      onEdit={handleOpenModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show filters for selected type only
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map((filter) => (
                  <FilterCard
                    key={filter._id}
                    filter={filter}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {filters.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-primary-600">No filters found. Create your first filter!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-primary-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-900">
                {editMode ? 'Edit Filter' : 'Add New Filter'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-primary-100 rounded-lg transition-colors touch-manipulation"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Filter Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={editMode}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                >
                  <option value="size">Size</option>
                  <option value="color">Color</option>
                  <option value="material">Material</option>
                  <option value="priceRange">Price Range</option>
                </select>
                {editMode && (
                  <p className="text-xs text-primary-500 mt-1">
                    Filter type cannot be changed after creation
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder={formData.type === 'priceRange' ? 'e.g., Under ₹5000' : 'e.g., UK 8'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Value (Internal) *
                </label>
                <input
                  type="text"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder={formData.type === 'priceRange' ? 'e.g., 0-5000' : 'e.g., uk-8'}
                />
                <p className="text-xs text-primary-500 mt-1">
                  Unique identifier for this filter option
                </p>
              </div>

              {/* Price Range Fields */}
              {formData.type === 'priceRange' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      name="minPrice"
                      value={formData.minPrice}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-900 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      name="maxPrice"
                      value={formData.maxPrice || ''}
                      onChange={handleChange}
                      min="0"
                      placeholder="No limit"
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="0"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>
              
              <div>
                <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-900 rounded focus:ring-2 focus:ring-primary-900"
                  />
                  <span className="text-sm font-medium text-primary-900">Active Filter</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary touch-manipulation"
                >
                  {editMode ? 'Update Filter' : 'Create Filter'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn btn-secondary touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

// FilterCard Component
function FilterCard({ filter, onEdit, onDelete }) {
  return (
    <div className="bg-primary-50 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-primary-900">{filter.name}</h4>
          <p className="text-sm text-primary-500">{filter.value}</p>
          {filter.type === 'priceRange' && (
            <p className="text-xs text-primary-600 mt-1">
              ₹{filter.minPrice} - {filter.maxPrice ? `₹${filter.maxPrice}` : 'No limit'}
            </p>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            filter.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {filter.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => onEdit(filter)}
          className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FiEdit2 className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={() => onDelete(filter._id, filter.name)}
          className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiTrash2 className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
}
