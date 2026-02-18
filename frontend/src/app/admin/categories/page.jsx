'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useToggleCategoryStatus } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiImage } from 'react-icons/fi';

export default function CategoriesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: categoriesData, isLoading: loading } = useAdminCategories();
  const categories = categoriesData?.categories || [];
  const createCategoryMut = useCreateCategory();
  const updateCategoryMut = useUpdateCategory();
  const deleteCategoryMut = useDeleteCategory();
  const toggleStatusMut = useToggleCategoryStatus();
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    showInNavbar: true,
    displayOrder: 0,
    isActive: true,
    image: { url: '', publicId: '' },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditMode(true);
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        showInNavbar: category.showInNavbar !== undefined ? category.showInNavbar : true,
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive,
        image: category.image || { url: '', publicId: '' },
      });
      setImagePreview(category.image?.url || '');
    } else {
      setEditMode(false);
      setSelectedCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        showInNavbar: true,
        displayOrder: 0,
        isActive: true,
        image: { url: '', publicId: '' },
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedCategory(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: { url: '', publicId: '' },
      showInNavbar: true,
      displayOrder: 0,
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        const errorMessage = reader.error?.message 
          ? `Failed to read image: ${reader.error.message}` 
          : 'Failed to read image file';
        toast.error(errorMessage);
        setImageFile(null);
        setImagePreview('');
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      setUploadingImage(true);
      
      // Generate a slug-safe filename for the category
      const categorySlug = formData.slug || formData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Step 1: Get signed upload URL
      const { data: responseData } = await adminAPI.getUploadUrl({
        fileName: imageFile.name,
        fileType: imageFile.type,
        productSlug: `categories/${categorySlug}`, // Use category path
      });
      
      // Validate response structure
      const uploadUrlData = responseData?.data || responseData;
      if (!uploadUrlData?.signedUrl || !uploadUrlData?.publicUrl || !uploadUrlData?.key) {
        console.error('Invalid response structure:', uploadUrlData);
        throw new Error('Invalid upload URL response');
      }
      
      // Step 2: Upload image to MinIO
      const uploadResponse = await fetch(uploadUrlData.signedUrl, {
        method: 'PUT',
        body: imageFile,
        headers: {
          'Content-Type': imageFile.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload: ${uploadResponse.statusText}`);
      }
      
      // Return image data
      return {
        url: uploadUrlData.publicUrl,
        publicId: uploadUrlData.key,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let imageData = formData.image;
      
      // Upload new image if selected
      if (imageFile) {
        const uploadedImage = await uploadImage();
        if (uploadedImage) {
          imageData = {
            url: uploadedImage.url,
            publicId: uploadedImage.key
          };
        } else {
          // If user selected a new image but upload failed, abort submission
          toast.error('Image upload failed. Please try again.');
          return;
        }
      }

      const submitData = {
        ...formData,
        image: imageData
      };

      if (editMode) {
        updateCategoryMut.mutate({ id: selectedCategory._id, data: submitData });
      } else {
        createCategoryMut.mutate(submitData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    deleteCategoryMut.mutate(id);
  };

  const handleToggleStatus = (id) => {
    toggleStatusMut.mutate(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
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
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Category Thumbnail */}
              {category.image?.url && (
                <div className="w-full h-48 bg-gray-100">
                  <img
                    src={category.image.url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-primary-500">/{category.slug}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {category.showInNavbar && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Navbar
                      </span>
                    )}
                  </div>
                </div>
              
              {category.description && (
                <p className="text-sm text-primary-600 mb-3">
                  {category.description}
                </p>
              )}

              {/* Category Metadata */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  Order: {category.displayOrder || 0}
                </span>
                {!category.showInNavbar && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Hidden from navbar
                  </span>
                )}
              </div>
              
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

              {/* Category Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Category Thumbnail
                </label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative w-full h-48 border-2 border-primary-200 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData({...formData, image: { url: '', publicId: '' }});
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-primary-50">
                      <FiImage className="w-12 h-12 text-primary-400 mb-2" />
                      <span className="text-sm text-primary-600 mb-1">Upload category image</span>
                      <span className="text-xs text-primary-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

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
                  Lower numbers appear first in the navbar
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="showInNavbar"
                    checked={formData.showInNavbar}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-900 rounded focus:ring-2 focus:ring-primary-900"
                  />
                  <span className="text-sm font-medium text-primary-900">Show in Navbar</span>
                </label>
                <p className="text-xs text-primary-500 ml-6">
                  Display this category in the navigation menu
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
                  <span className="text-sm font-medium text-primary-900">Active Category</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 btn btn-primary touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? 'Uploading...' : (editMode ? 'Update Category' : 'Create Category')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={uploadingImage}
                  className="flex-1 btn btn-secondary touch-manipulation disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
