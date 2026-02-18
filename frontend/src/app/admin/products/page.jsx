'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useProducts,
  useDeleteProduct,
  useBulkDeleteProducts,
  useUpdateProductStatus,
  useBulkUpdateProductStatus,
  useToggleFeatured
} from '@/hooks/useProducts';
import { useAdminCategories, useBrands } from '@/hooks/useAdmin';
import ProductFilters from '@/components/admin/products/ProductFilters';
import ProductTable from '@/components/admin/products/ProductTable';
import { FiPlus, FiGrid } from 'react-icons/fi';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Filters Data via React Query
  const { data: catsData } = useAdminCategories();
  const categories = catsData?.categories || [];
  const { data: brandsData } = useBrands();
  const brands = brandsData?.brands || brandsData || [];

  // TanStack Query for Products
  const { data: productData, isLoading: loadingProducts } = useProducts({
    page: currentPage,
    limit: 20,
    search: debouncedSearch,
    status: filterStatus,
    category: filterCategory,
    brand: filterBrand,
    stockStatus: filterStock,
    sortBy,
    order: sortOrder
  });

  // Mutations
  const deleteProduct = useDeleteProduct();
  const bulkDelete = useBulkDeleteProducts();
  const updateStatus = useUpdateProductStatus();
  const bulkStatus = useBulkUpdateProductStatus();
  const toggleFeatured = useToggleFeatured();

  const products = productData?.products || [];
  const totalPages = productData?.totalPages || 1;
  const totalProducts = productData?.total || 0;

  // Clear selection when data reloads (optional, but good UX to avoid stale selections)
  // implementing this via useEffect on products change if strict behavior needed, 
  // currently we can just clear it manually on bulk actions.

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
    bulkDelete.mutate(selectedProducts, {
      onSuccess: () => setSelectedProducts([]) // Clear selection on success
    });
  };

  const handleBulkStatus = async (status) => {
    bulkStatus.mutate({ ids: selectedProducts, status }, {
      onSuccess: () => setSelectedProducts([])
    });
  };

  const handleToggleStatus = (productId, currentStatus) => {
    updateStatus.mutate({ id: productId, currentStatus });
  };

  const handleToggleFeatured = (productId, currentFeatured) => {
    toggleFeatured.mutate({ id: productId, currentFeatured });
  };

  const handleDeleteProduct = (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    deleteProduct.mutate(productId);
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
    </div>
  );

  return (
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
                onClick={() => router.push('/admin/products/bulk')}
                className="btn bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 flex items-center gap-2 justify-center w-full sm:w-auto touch-manipulation mr-2"
              >
                <FiGrid /> Bulk Edit
              </button>
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
  );
}
