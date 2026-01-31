'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, categoryAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck } from 'react-icons/fi';

export default function CategoriesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditMode(true);
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        isActive: category.isActive,
      });
    } else {
      setEditMode(false);
      setSelectedCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name' && !editMode) {
      // Auto-generate slug for new categories
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData({ ...formData, name: value, slug });
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
      if (editMode) {
        await adminAPI.updateCategory(selectedCategory._id, formData);
        toast.success('Category updated successfully');
      } else {
        await adminAPI.createCategory(formData);
        toast.success('Category created successfully');
      }
      
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    
    try {
      await adminAPI.deleteCategory(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminAPI.updateCategory(id, { isActive: !currentStatus });
      toast.success('Category status updated');
      fetchCategories();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update category status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Categories</h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1">Manage product categories</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary flex items-center gap-2 justify-center w-full sm:w-auto touch-manipulation"
          >
            <FiPlus />
            Add Category
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-primary-500">/{category.slug}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    category.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {category.description && (
                <p className="text-sm text-primary-600 mb-4">
                  {category.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 pt-3 border-t border-primary-100">
                <button
                  onClick={() => handleToggleStatus(category._id, category.isActive)}
                  className="flex-1 px-3 py-2 text-sm border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors touch-manipulation"
                >
                  {category.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                >
                  <FiEdit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(category._id, category.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-primary-600">No categories found. Create your first category!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-primary-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-900">
                {editMode ? 'Edit Category' : 'Add New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., Casual Shoes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., casual-shoes"
                />
                <p className="text-xs text-primary-500 mt-1">
                  URL-friendly version of the name
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="Brief description of this category"
                />
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
                  <span className="text-sm font-medium text-primary-900">Active Category</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary touch-manipulation"
                >
                  {editMode ? 'Update Category' : 'Create Category'}
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
