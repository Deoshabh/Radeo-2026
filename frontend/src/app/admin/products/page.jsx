'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiEye, FiEyeOff, FiStar } from 'react-icons/fi';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchProducts();
    }
  }, [isAuthenticated, user]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await adminAPI.getAllProducts();
      console.log('📦 Admin Products API response:', response.data);
      // Backend returns array directly, not wrapped in {products: [...]}
      const productsData = Array.isArray(response.data) ? response.data : (response.data.products || []);
      console.log(`✅ Admin loaded ${productsData.length} products`);
      setProducts(productsData);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await adminAPI.toggleProductStatus(productId);
      toast.success(`Product ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleToggleFeatured = async (productId, currentFeatured) => {
    try {
      await adminAPI.toggleProductFeatured(productId);
      toast.success(`Product ${currentFeatured ? 'unmarked' : 'marked'} as featured`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await adminAPI.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading || loadingProducts) {
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Products Management</h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1">Manage your product catalog</p>
          </div>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="btn btn-primary flex items-center gap-2 justify-center w-full sm:w-auto touch-manipulation"
          >
            <FiPlus /> Add New Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors touch-manipulation ${
                    filterStatus === status
                      ? 'bg-primary-900 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Featured</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-primary-600">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover rounded border border-primary-200"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-primary-900">{product.name}</p>
                            <p className="text-sm text-primary-600">{product.category?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-primary-700">{product.brand}</td>
                      <td className="px-6 py-4 text-primary-900 font-semibold">₹{product.price?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${product.stock > 10 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(product._id, product.status)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.status === 'active' ? <FiEye /> : <FiEyeOff />}
                          {product.status}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleFeatured(product._id, product.isFeatured)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.isFeatured
                              ? 'text-yellow-500 hover:bg-yellow-50'
                              : 'text-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          <FiStar className={product.isFeatured ? 'fill-current' : ''} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/products/new?edit=${product._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-primary-600 text-sm mb-1">Total Products</p>
            <p className="text-2xl font-bold text-primary-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-primary-600 text-sm mb-1">Active Products</p>
            <p className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-primary-600 text-sm mb-1">Low Stock Products</p>
            <p className="text-2xl font-bold text-red-600">
              {products.filter((p) => p.stock <= 10).length}
            </p>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
