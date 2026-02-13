'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, productAPI, categoryAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import ProductFilters from '@/components/admin/products/ProductFilters';
import ProductTable from '@/components/admin/products/ProductTable';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';

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

          {/* Filters */}
          <ProductFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterBrand={filterBrand}
            setFilterBrand={setFilterBrand}
            filterStock={filterStock}
            setFilterStock={setFilterStock}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            categories={categories}
            brands={brands}
          />

          {/* Table */}
          <ProductTable
            products={products}
            loading={loadingProducts}
            selectedProducts={selectedProducts}
            handleSelectAll={handleSelectAll}
            handleSelectRow={handleSelectRow}
            sortBy={sortBy}
            sortOrder={sortOrder}
            handleSort={handleSort}
            handleToggleStatus={handleToggleStatus}
            handleToggleFeatured={handleToggleFeatured}
            handleDeleteProduct={handleDeleteProduct}
          />

          {/* Pagination */}
          <div className="bg-white border-t border-primary-200 px-6 py-4 flex items-center justify-between rounded-b-lg shadow-md mt-[-1px]">
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
    </AdminLayout>
  );
}
