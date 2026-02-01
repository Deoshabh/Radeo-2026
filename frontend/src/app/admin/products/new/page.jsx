'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminAPI, categoryAPI, productAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import ColorPicker from '@/components/ColorPicker';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiPlus, FiMinus } from 'react-icons/fi';

function ProductFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams?.get('edit');
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
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
    if (editProductId) {
      setIsEditMode(true);
      fetchProductData(editProductId);
    }
  }, [user, editProductId]);

  const fetchProductData = async (productId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getProductById(productId);
      const product = response.data.product || response.data;
      
      // Populate form with existing data
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price || '',
        comparePrice: product.comparePrice || '',
        category: product.category || '',
        brand: product.brand || '',
        sku: product.sku || '',
        stock: product.stock || '',
        sizes: product.sizes?.map(s => typeof s === 'object' ? s.size : s) || [],
        colors: product.colors || [],
        tags: product.tags?.join(', ') || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFeatured: product.featured || false,
      });
      
      // Set existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
        const previews = product.images.map(img => img.url || img);
        setImagePreviews(previews);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getAllCategories();
      // Backend returns {categories: [...]}
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
    // Check if it's an existing image or new image
    if (index < existingImages.length) {
      // Remove from existing images
      setExistingImages(existingImages.filter((_, i) => i !== index));
    } else {
      // Remove from new images
      const newImageIndex = index - existingImages.length;
      setImages(images.filter((_, i) => i !== newImageIndex));
    }
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSizeChange = (e) => {
    const value = e.target.value;
    const sizes = value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData({ ...formData, sizes });
  };

  const handleColorChange = (colors) => {
    setFormData({ ...formData, colors });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For edit mode, allow existing images
    if (!isEditMode && images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }
    
    if (isEditMode && existingImages.length === 0 && images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }
    
    if (!formData.slug) {
      toast.error('Product slug is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Upload new images to MinIO (if any)
      let uploadedImages = [];
      
      if (images.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' });
      
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          
          try {
            // Get signed upload URL
            const { data: responseData } = await adminAPI.getUploadUrl({
              fileName: file.name,
              fileType: file.type,
              productSlug: formData.slug,
            });
            
            console.log('Upload URL response:', responseData);
            
            // Validate response structure
            const uploadUrlData = responseData?.data || responseData;
            if (!uploadUrlData?.signedUrl || !uploadUrlData?.publicUrl || !uploadUrlData?.key) {
              console.error('Invalid response structure:', uploadUrlData);
              throw new Error(`Invalid upload URL response for ${file.name}`);
            }
            
            console.log('Using upload URL:', uploadUrlData.signedUrl);
            
            // Upload image to MinIO
            const uploadResponse = await fetch(uploadUrlData.signedUrl, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type,
              },
            });
            
            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload ${file.name}: ${uploadResponse.statusText}`);
            }
            
            // Add image metadata
            uploadedImages.push({
              url: uploadUrlData.publicUrl,
              key: uploadUrlData.key,
              isPrimary: existingImages.length === 0 && i === 0,
              order: existingImages.length + i,
            });
            
            console.log(`Image ${i + 1} uploaded:`, uploadedImages[i]);
          } catch (uploadError) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError);
            toast.error(`Failed to upload ${file.name}`);
            throw uploadError;
          }
        }
        
        console.log('All new images uploaded:', uploadedImages);
        toast.success('Images uploaded successfully', { id: 'upload' });
      }
      
      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImages];
      
      // Step 2: Prepare product data
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        images: allImages,
        featured: formData.isFeatured,
      };
      
      // Add optional fields if they exist
      if (formData.comparePrice) {
        productData.comparePrice = Number(formData.comparePrice);
      }
      
      if (formData.brand) {
        productData.brand = formData.brand;
      }
      
      if (formData.sku) {
        productData.sku = formData.sku;
      }
      
      if (formData.stock) {
        productData.stock = Number(formData.stock);
      } else {
        // Default stock to 100 if not specified
        productData.stock = 100;
      }
      
      if (formData.sizes && formData.sizes.length > 0) {
        productData.sizes = formData.sizes.map(size => ({
          size: size.toString(),
          stock: formData.stock ? Math.floor(Number(formData.stock) / formData.sizes.length) : 0,
        }));
      }
      
      if (formData.colors && formData.colors.length > 0) {
        productData.colors = formData.colors;
      }
      
      if (formData.tags) {
        productData.tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      
      productData.isActive = formData.isActive;
      
      console.log('Product data to send:', productData);
      
      // Step 3: Create or Update product
      if (isEditMode) {
        toast.loading('Updating product...', { id: 'update' });
        await adminAPI.updateProduct(editProductId, productData);
        toast.success('Product updated successfully', { id: 'update' });
      } else {
        toast.loading('Creating product...', { id: 'create' });
        await adminAPI.createProduct(productData);
        toast.success('Product created successfully', { id: 'create' });
      }
      router.push('/admin/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm sm:text-base text-primary-600 mt-1">
            {isEditMode ? 'Update product information' : 'Create a new product listing'}
          </p>
        </div>

        {loading && !isEditMode ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
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
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
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
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-2">
                  Sizes (UK)
                </label>
                <input
                  type="text"
                  value={formData.sizes.join(', ')}
                  onChange={handleSizeChange}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                  placeholder="e.g., 6, 7, 8, 9, 10"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Separate sizes with commas
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-3">
                  Colors
                </label>
                <ColorPicker 
                  selectedColors={formData.colors}
                  onChange={handleColorChange}
                />
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
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
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
        )}
      </div>
    </div>
    </AdminLayout>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown mx-auto mb-4"></div>
            <p className="text-primary-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <ProductFormContent />
    </Suspense>
  );
}
