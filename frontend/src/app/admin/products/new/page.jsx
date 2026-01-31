'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, categoryAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiPlus, FiMinus } from 'react-icons/fi';

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    comparePrice: '',
    category: '',
    brand: '',
    sku: '',
    stock: '',
    sizes: [],
    colors: [],
    tags: '',
    isActive: true,
    isFeatured: false,
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
      const response = await categoryAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      // Auto-generate slug
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
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    setImages([...images, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSizeChange = (e) => {
    const value = e.target.value;
    const sizes = value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData({ ...formData, sizes });
  };

  const handleColorChange = (e) => {
    const value = e.target.value;
    const colors = value.split(',').map(c => c.trim()).filter(Boolean);
    setFormData({ ...formData, colors });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const data = new FormData();
      
      // Append images
      images.forEach((image) => {
        data.append('images', image);
      });
      
      // Append other fields
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          // Convert tags string to array
          const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
          data.append(key, JSON.stringify(tagsArray));
        } else if (key === 'sizes' || key === 'colors') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });
      
      await adminAPI.createProduct(data);
      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Add New Product</h1>
          <p className="text-sm sm:text-base text-primary-600 mt-1">Create a new product listing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Product Images</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-primary-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors touch-manipulation">
                  <FiUpload className="w-8 h-8 text-primary-400 mb-2" />
                  <span className="text-xs sm:text-sm text-primary-600">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs sm:text-sm text-primary-500">
              Upload up to 5 images. First image will be the main product image.
            </p>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., Classic Leather Oxford Shoes"
                />
              </div>
              
              <div className="sm:col-span-2">
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
                  placeholder="e.g., classic-leather-oxford-shoes"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Auto-generated from product name (can be edited)
                </p>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="Describe your product..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., 2999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Compare Price (₹)
                </label>
                <input
                  type="number"
                  name="comparePrice"
                  value={formData.comparePrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., 3999"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Original price for discount display
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., Nike, Adidas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., SH-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Variants</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Sizes (UK)
                </label>
                <input
                  type="text"
                  onChange={handleSizeChange}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., 6, 7, 8, 9, 10"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Separate sizes with commas
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Colors
                </label>
                <input
                  type="text"
                  onChange={handleColorChange}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., Black, Brown, Tan"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Separate colors with commas
                </p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Additional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., leather, formal, oxford"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Separate tags with commas
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-900 rounded focus:ring-2 focus:ring-primary-900"
                  />
                  <span className="text-sm font-medium text-primary-900">Active Product</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-900 rounded focus:ring-2 focus:ring-primary-900"
                  />
                  <span className="text-sm font-medium text-primary-900">Featured Product</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 touch-manipulation"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="btn btn-secondary flex-1 touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    </AdminLayout>
  );
}
