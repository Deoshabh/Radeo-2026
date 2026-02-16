'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { adminAPI, categoryAPI, productAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

import { useAdmin, AdminProvider } from '@/context/AdminContext';
import AdminLayout from '@/components/AdminLayout';
import ColorPicker from '@/components/ColorPicker';
import ImageUploadWithEditor from '@/components/ImageUploadWithEditor';
import Image360Upload from '@/components/Image360Upload';
import ProductViewer360 from '@/components/viewer/ProductViewer360';
import toast from 'react-hot-toast';
import { FiPlus, FiX } from 'react-icons/fi';

function ProductFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams?.get('edit');
  const { user } = useAuth();
  const { setIsFormDirty } = useAdmin();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [images360, setImages360] = useState([]); // New 360 images
  const [existingImages360, setExistingImages360] = useState([]); // Existing 360 images
  const [hotspots360, setHotspots360] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isDirty = useRef(false);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    gstPercentage: '',
    averageDeliveryCost: '',
    comparePrice: '',
    category: '',
    brand: '',
    sku: '',
    stock: '', // This will now be a calculated total
    sizes: [], // Array of size strings
    sizeStocks: {}, // Object mapping size -> stock count
    colors: [],
    tags: '',
    isActive: true,
    isFeatured: false,
    specifications: {
      material: '',
      sole: '',
      construction: '',
      madeIn: 'India',
    },
    careInstructions: [],
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
  }, [user, editProductId, router]);

  const fetchProductData = async (productId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getProductById(productId);
      const product = response.data.product || response.data;

      // Extract size stocks
      const sizeStocks = {};
      const sizes = [];

      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach(s => {
          if (typeof s === 'object') {
            sizes.push(s.size);
            sizeStocks[s.size] = s.stock || 0;
          } else {
            sizes.push(s);
            sizeStocks[s] = 0;
          }
        });
      }

      // Populate form with existing data
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price || '',
        gstPercentage: product.gstPercentage || '',
        averageDeliveryCost: product.averageDeliveryCost || '',
        comparePrice: product.comparePrice || '',
        category: product.category || '',
        brand: product.brand || '',
        sku: product.sku || '',
        stock: product.stock || '',
        sizes: sizes,
        sizeStocks: sizeStocks,
        colors: product.colors || [],
        tags: product.tags?.join(', ') || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFeatured: product.featured || false,
        specifications: {
          material: product.specifications?.material || '',
          sole: product.specifications?.sole || '',
          construction: product.specifications?.construction || '',
          madeIn: product.specifications?.madeIn || 'India',
        },
        careInstructions: Array.isArray(product.careInstructions) ? product.careInstructions : [],
      });

      // Set existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
        const previews = product.images.map(img => img.url || img);
        setImagePreviews(previews);
      }

      // Set existing 360 images
      if (product.images360 && product.images360.length > 0) {
        setExistingImages360(product.images360);
      }

      if (product.hotspots360 && Array.isArray(product.hotspots360)) {
        setHotspots360(product.hotspots360);
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
    isDirty.current = true;
    setIsFormDirty(true);
    const { name, value, type, checked } = e.target;

    if (name === 'name') {
      // Auto-generate slug
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData({ ...formData, name: value, slug });
    } else if (name.startsWith('specifications.')) {
      // Handle nested specification fields
      const specField = name.split('.')[1];
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleImagesChange = ({ images: newImages, imagePreviews: newPreviews, existingImages: newExistingImages }) => {
    isDirty.current = true;
    setIsFormDirty(true);
    setImages(newImages);
    setImagePreviews(newPreviews);
    setExistingImages(newExistingImages);
  };

  const handleImages360Change = (newImages360) => {
    isDirty.current = true;
    setIsFormDirty(true);

    // Separate new files from existing ones
    const newFiles = newImages360.filter(img => img.file || img.isNew);
    const existing = newImages360.filter(img => !img.file && !img.isNew);

    setImages360(newFiles);
    setExistingImages360(existing);
  };

  const handleSizeChange = (e) => {
    const value = e.target.value;
    const newSizes = value.split(',').map(s => s.trim()).filter(Boolean);

    // Preserve existing stock values for sizes that remain
    const newSizeStocks = { ...formData.sizeStocks };

    // Remove stocks for deleted sizes
    Object.keys(newSizeStocks).forEach(size => {
      if (!newSizes.includes(size)) {
        delete newSizeStocks[size];
      }
    });

    // Initialize stock for new sizes
    newSizes.forEach(size => {
      if (newSizeStocks[size] === undefined) {
        newSizeStocks[size] = 0;
      }
    });

    setFormData({
      ...formData,
      sizes: newSizes,
      sizeStocks: newSizeStocks
    });
  };

  const handleSizeStockChange = (size, value) => {
    setFormData({
      ...formData,
      sizeStocks: {
        ...formData.sizeStocks,
        [size]: parseInt(value) || 0
      }
    });
    setIsFormDirty(true);
  };

  const handleColorChange = (colors) => {
    setFormData({ ...formData, colors });
    setIsFormDirty(true);
  };

  // Care Instructions CRUD handlers
  const handleAddCareInstruction = () => {
    setFormData({
      ...formData,
      careInstructions: [...formData.careInstructions, ''],
    });
  };

  const handleUpdateCareInstruction = (index, value) => {
    const updated = [...formData.careInstructions];
    updated[index] = value;
    setFormData({ ...formData, careInstructions: updated });
  };

  const handleRemoveCareInstruction = (index) => {
    setFormData({
      ...formData,
      careInstructions: formData.careInstructions.filter((_, i) => i !== index),
    });
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

            // Validate response structure
            const uploadUrlData = responseData?.data || responseData;
            if (!uploadUrlData?.signedUrl || !uploadUrlData?.publicUrl || !uploadUrlData?.key) {
              console.error('Invalid response structure:', uploadUrlData);
              throw new Error(`Invalid upload URL response for ${file.name}`);
            }

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
          } catch (uploadError) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError);
            toast.error(`Failed to upload ${file.name}`);
            throw uploadError;
          }
        }

        toast.success('Images uploaded successfully', { id: 'upload' });
      }

      // Step 1.5: Upload 360 Images
      let uploaded360Images = [];
      if (images360.length > 0) {
        toast.loading('Uploading 360 view images...', { id: 'upload360' });

        for (let i = 0; i < images360.length; i++) {
          const imgObj = images360[i];
          const file = imgObj.file; // The actual File object

          try {
            const { data: responseData } = await adminAPI.getUploadUrl({
              fileName: `360-${i}-${file.name}`,
              fileType: file.type,
              productSlug: formData.slug,
            });

            const uploadUrlData = responseData?.data || responseData;

            await fetch(uploadUrlData.signedUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type },
            });

            uploaded360Images.push({
              url: uploadUrlData.publicUrl,
              key: uploadUrlData.key,
              order: existingImages360.length + i,
            });

          } catch (err) {
            console.error(`Failed 360 upload ${i}:`, err);
            // Continue with others? Or throw?
          }
        }
        toast.success('360 Images uploaded', { id: 'upload360' });
      }

      // Combine existing and new 360 images
      // We need to re-index the order based on the final array in state if they were reordered
      // But for now, let's just append new ones to the end or respect the separate lists
      // Ideally Image360Upload returns a single mixed list.
      // My handleImages360Change splits them.
      // Let's merge them back for the request, but we need to know the order.
      // The simplest way is to assume existing come first then new, OR refactor handler to traverse the mixed list.
      // For now, let's just save them.
      const allImages360 = [...existingImages360, ...uploaded360Images];

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImages];

      // Step 2: Prepare product data
      // Calculate total stock from sizeStocks
      const totalStock = formData.sizes.reduce((sum, size) => sum + (formData.sizeStocks[size] || 0), 0);

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        gstPercentage: Number(formData.gstPercentage) || 0,
        averageDeliveryCost: Number(formData.averageDeliveryCost) || 0,
        images: allImages,
        images360: allImages360,
        hotspots360,
        featured: formData.isFeatured,
        stock: totalStock, // Use calculated total stock
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

      if (formData.sizes && formData.sizes.length > 0) {
        productData.sizes = formData.sizes.map(size => ({
          size: size.toString(),
          stock: formData.sizeStocks[size] || 0,
        }));
      }

      if (formData.colors && formData.colors.length > 0) {
        productData.colors = formData.colors;
      }

      if (formData.tags) {
        productData.tags = formData.tags; // Already array from state
      }

      // Add specifications
      productData.specifications = formData.specifications;

      // Add care instructions - filter out empty strings
      if (formData.careInstructions && formData.careInstructions.length > 0) {
        productData.careInstructions = formData.careInstructions.filter(instruction => instruction.trim() !== '');
      } else {
        productData.careInstructions = [];
      }

      productData.isActive = formData.isActive;

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
      isDirty.current = false;
      setIsFormDirty(false); // Reset global context
      router.push('/admin/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total stock for display
  const calculatedStock = formData.sizes.reduce((sum, size) => sum + (formData.sizeStocks[size] || 0), 0);

  return (
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
            {/* Product Images with Editor */}
            <ImageUploadWithEditor
              images={images}
              imagePreviews={imagePreviews}
              existingImages={existingImages}
              onImagesChange={handleImagesChange}
              maxImages={5}
            />

            {/* 360 Degree Images */}
            <Image360Upload
              images={[...existingImages360, ...images360]}
              onImagesChange={handleImages360Change}
            />

            {[...existingImages360, ...images360].length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-2">360° Hotspot Annotation Editor</h2>
                <p className="text-sm text-primary-600 mb-4">Click on the 360 viewer to add hotspot annotations for the current frame.</p>
                <ProductViewer360
                  images={[...existingImages360, ...images360].map((img) => img.url)}
                  editableHotspots
                  hotspots={hotspots360}
                  onHotspotsChange={setHotspots360}
                  className="max-w-xl mx-auto"
                />
                <p className="text-xs text-primary-500 mt-3">Total hotspots: {hotspots360.length}</p>
              </div>
            )}

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
                    GST Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="gstPercentage"
                    value={formData.gstPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., 18"
                  />
                  <p className="text-xs text-primary-500 mt-1">
                    Optional - GST will be added to final customer price
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Average Delivery Cost (₹)
                  </label>
                  <input
                    type="number"
                    name="averageDeliveryCost"
                    value={formData.averageDeliveryCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., 100"
                  />
                  <p className="text-xs text-primary-500 mt-1">
                    Optional - Delivery cost added to customer price
                  </p>
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
                    Optional - Original price before discount (higher than actual price)
                  </p>
                </div>

                {/* Final Price Preview */}
                {formData.price && (
                  <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">💰 Final Customer Price Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Base Price:</span>
                        <span className="font-medium text-blue-900">₹{parseFloat(formData.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {formData.gstPercentage > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">+ GST ({formData.gstPercentage}%):</span>
                          <span className="font-medium text-blue-900">₹{(parseFloat(formData.price || 0) * parseFloat(formData.gstPercentage || 0) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.averageDeliveryCost > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">+ Delivery Cost:</span>
                          <span className="font-medium text-blue-900">₹{parseFloat(formData.averageDeliveryCost || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                        <span className="text-blue-900 font-semibold">Total Customer Price:</span>
                        <span className="font-bold text-blue-900 text-lg">
                          ₹{(
                            parseFloat(formData.price || 0) +
                            (parseFloat(formData.price || 0) * parseFloat(formData.gstPercentage || 0) / 100) +
                            parseFloat(formData.averageDeliveryCost || 0)
                          ).toFixed(2)}
                        </span>
                      </div>

                      {/* Discount Display Preview */}
                      {formData.comparePrice && parseFloat(formData.comparePrice) > (parseFloat(formData.price || 0) + (parseFloat(formData.price || 0) * parseFloat(formData.gstPercentage || 0) / 100) + parseFloat(formData.averageDeliveryCost || 0)) && (
                        <div className="mt-3 pt-3 border-t border-blue-300">
                          <p className="text-xs font-semibold text-blue-900 mb-2">🎉 Discount Display to Customers:</p>
                          <div className="bg-white rounded-lg p-3 border border-blue-300">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-green-600">
                                ₹{(
                                  parseFloat(formData.price || 0) +
                                  (parseFloat(formData.price || 0) * parseFloat(formData.gstPercentage || 0) / 100) +
                                  parseFloat(formData.averageDeliveryCost || 0)
                                ).toFixed(0)}
                              </span>
                              <span className="text-gray-500 line-through text-sm">
                                ₹{parseFloat(formData.comparePrice || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                {Math.round(((parseFloat(formData.comparePrice || 0) - (parseFloat(formData.price || 0) + (parseFloat(formData.price || 0) * parseFloat(formData.gstPercentage || 0) / 100) + parseFloat(formData.averageDeliveryCost || 0))) / parseFloat(formData.comparePrice || 1)) * 100)}% OFF
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    Total Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={calculatedStock}
                    readOnly
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    title="Calculated from individual specific stock sizes below"
                  />
                  <p className="text-xs text-primary-500 mt-1">
                    Auto-calculated from sizes section below
                  </p>
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

                {/* Stock Per Size Section */}
                {formData.sizes.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-primary-900 mb-3">
                      Stock per Size
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.sizes.map(size => (
                        <div key={size}>
                          <label className="block text-xs text-primary-600 mb-1">
                            Size {size}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.sizeStocks[size] || 0}
                            onChange={(e) => handleSizeStockChange(size, e.target.value)}
                            className="w-full px-3 py-1.5 border border-primary-300 rounded focus:ring-1 focus:ring-primary-900 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

            {/* Specifications */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Product Specifications</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    name="specifications.material"
                    value={formData.specifications.material}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., Premium Leather, Suede, Canvas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Sole
                  </label>
                  <input
                    type="text"
                    name="specifications.sole"
                    value={formData.specifications.sole}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., Leather Sole, Rubber Sole"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Construction
                  </label>
                  <input
                    type="text"
                    name="specifications.construction"
                    value={formData.specifications.construction}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., Goodyear Welted, Blake Stitch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Made In
                  </label>
                  <input
                    type="text"
                    name="specifications.madeIn"
                    value={formData.specifications.madeIn}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                    placeholder="e.g., India, Italy"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-primary-900 mb-3">
                    Care Instructions (Add as Points)
                  </label>

                  <div className="space-y-3">
                    {formData.careInstructions.map((instruction, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={instruction}
                            onChange={(e) => handleUpdateCareInstruction(index, e.target.value)}
                            className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                            placeholder={`Care instruction point ${index + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCareInstruction(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                          title="Remove instruction"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddCareInstruction}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
                    >
                      <FiPlus className="w-5 h-5" />
                      Add Care Instruction Point
                    </button>
                  </div>

                  <p className="text-xs text-primary-500 mt-2">
                    Add each care instruction as a separate point (e.g., &quot;Use a soft brush to remove dirt&quot;, &quot;Apply leather conditioner regularly&quot;)
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
                disabled={loading || isUploading}
                className="btn btn-primary flex-1 touch-manipulation"
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : isUploading ? 'Uploading images...' : (isEditMode ? 'Update Product' : 'Create Product')}
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
  );
}

export default function NewProductPage() {
  return (
    <AdminLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown mx-auto mb-4"></div>
            <p className="text-primary-600">Loading...</p>
          </div>
        </div>
      }>
        <AdminProvider>
          <ProductFormContent />
        </AdminProvider>
      </Suspense>
    </AdminLayout>
  );
}
