'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, productAPI, categoryAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import toast from 'react-hot-toast';
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiStar,
  FiFilter,
  FiChevronUp,
  FiChevronDown,
  FiCheckSquare,
  FiSquare,
  FiMoreHorizontal
} from 'react-icons/fi';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // Data State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Selection State
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Auth Check
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isAuthenticated, loading, router]);

  // Initial Data Fetch (Categories/Brands)
  useEffect(() => {
    const fetchFilters = async () => {
      if (isAuthenticated && user?.role === 'admin') {
        try {
          const [catRes, brandRes] = await Promise.all([
            categoryAPI.getAllCategories(),
            productAPI.getBrands()
          ]);
          setCategories(catRes.data.categories || []);
          setBrands(brandRes.data || []);
        } catch (error) {
          console.error('Failed to fetch filters:', error);
        }
      }
    };
    fetchFilters();
  }, [isAuthenticated, user]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    try {
      setLoadingProducts(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery,
        status: filterStatus,
        category: filterCategory,
        brand: filterBrand,
        stockStatus: filterStock,
        sortBy,
        order: sortOrder
      };

      const response = await adminAPI.getAllProducts(params);
      const data = response.data;

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
      setCurrentPage(data.page || 1);

      // Clear selection on refresh/filter change
      setSelectedProducts([]);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, [
    isAuthenticated,
    user,
    currentPage,
    searchQuery,
    filterStatus,
    filterCategory,
    filterBrand,
    filterStock,
    sortBy,
    sortOrder
  ]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    // Debounce search
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  // Handlers
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to desc for new field
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      await adminAPI.bulkDeleteProducts(selectedProducts);
      toast.success('Products deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete products');
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await adminAPI.bulkUpdateProductStatus(selectedProducts, status === 'active');
      toast.success('Product status updated');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update status');
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

  if (loading) return null;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Products Management</h1>
              <p className="text-sm sm:text-base text-primary-600 mt-1">
                {totalProducts} products found
              </p>
            </div>
            <div className="flex gap-2">
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2 mr-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-primary-200">
                  <span className="text-sm font-medium text-primary-700">{selectedProducts.length} selected</span>
                  <div className="h-4 w-px bg-primary-200 mx-1"></div>
                  <button
                    onClick={() => handleBulkStatus('active')}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatus('inactive')}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              )}
              <button
                onClick={() => router.push('/admin/products/new')}
                className="btn btn-primary flex items-center gap-2 justify-center w-full sm:w-auto touch-manipulation"
              >
                <FiPlus /> Add New Product
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-grow">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                />
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.slug || cat.name}>{cat.name}</option>
                  ))}
                </select>

                {/* Brand Filter */}
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 bg-white"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                {/* Stock Filter */}
                <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
                  className="px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 bg-white"
                >
                  <option value="all">All Stock</option>
                  <option value="low">Low Stock (&lt;10)</option>
                  <option value="out">Out of Stock</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50 border-b border-primary-200">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={products.length > 0 && selectedProducts.length === products.length}
                        className="rounded border-primary-300 text-primary-900 focus:ring-primary-900"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-primary-900 cursor-pointer hover:bg-primary-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Product
                        {sortBy === 'name' && (sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-primary-900 cursor-pointer hover:bg-primary-100 transition-colors"
                      onClick={() => handleSort('brand')}
                    >
                      <div className="flex items-center gap-1">
                        Brand
                        {sortBy === 'brand' && (sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-primary-900 cursor-pointer hover:bg-primary-100 transition-colors"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortBy === 'price' && (sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-primary-900 cursor-pointer hover:bg-primary-100 transition-colors"
                      onClick={() => handleSort('stock')}
                    >
                      <div className="flex items-center gap-1">
                        Stock
                        {sortBy === 'stock' && (sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-primary-600">
                        No products found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} className="hover:bg-primary-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectRow(product._id)}
                            className="rounded border-primary-300 text-primary-900 focus:ring-primary-900"
                          />
                        </td>
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
                              <p className="font-medium text-primary-900 line-clamp-1">{product.name}</p>
                              <p className="text-sm text-primary-600">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-primary-700 font-medium">
                          {product.brand || '-'}
                        </td>
                        <td className="px-6 py-4 text-primary-900 font-semibold">₹{product.price?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${product.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleToggleStatus(product._id, product.status)}
                              className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${product.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {product.status === 'active' ? <FiEye className="w-3 h-3" /> : <FiEyeOff className="w-3 h-3" />}
                              {product.status}
                            </button>
                            <button
                              onClick={() => handleToggleFeatured(product._id, product.featured)}
                              className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${product.featured
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'text-primary-400 hover:text-primary-600'
                                }`}
                            >
                              <FiStar className={`w-3 h-3 ${product.featured ? 'fill-current' : ''}`} />
                              {product.featured ? 'Featured' : 'Not Featured'}
                            </button>
                          </div>

                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
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

            {/* Footer / Pagination */}
            <div className="border-t border-primary-200 px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-primary-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm border border-primary-200 rounded hover:bg-primary-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm border border-primary-200 rounded hover:bg-primary-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
