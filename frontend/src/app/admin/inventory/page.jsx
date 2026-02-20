'use client';

import { useState, useMemo } from 'react';
import { useInventory, useStockMovements, useUpdateStock, useToggleOutOfStock } from '@/hooks/useAdmin';
import { formatPrice } from '@/utils/helpers';
import {
  FiPackage, FiAlertTriangle, FiSearch, FiRefreshCw,
  FiChevronDown, FiChevronUp, FiFilter, FiDatabase,
  FiTrendingDown, FiEdit3, FiCheck, FiX, FiClock, FiBox,
  FiToggleLeft, FiToggleRight
} from 'react-icons/fi';

const STOCK_FILTERS = [
  { key: 'all', label: 'All Products', color: 'primary' },
  { key: 'out', label: 'Out of Stock', color: 'red' },
  { key: 'low', label: 'Low Stock (≤10)', color: 'amber' },
  { key: 'healthy', label: 'In Stock', color: 'green' },
];

function StockBadge({ stock, isOutOfStock }) {
  if (isOutOfStock && stock > 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700" title="Manually marked Out of Stock">Override</span>;
  if (stock <= 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Out</span>;
  if (stock <= 10) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Low ({stock})</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{stock}</span>;
}

function InlineStockEditor({ product }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.stock);
  const updateStockMut = useUpdateStock();

  const handleSave = () => {
    updateStockMut.mutate(
      { id: product._id, stock: Number(value) },
      { onSuccess: () => setEditing(false) }
    );
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-sm text-primary-700 hover:text-primary-900 transition-colors group"
      >
        <span className="font-medium">{product.stock}</span>
        <FiEdit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 px-2 py-1 border border-primary-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
        min="0"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      />
      <button onClick={handleSave} disabled={updateStockMut.isPending} className="p-1 text-green-600 hover:bg-green-50 rounded">
        <FiCheck className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="p-1 text-primary-400 hover:bg-primary-50 rounded">
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function OutOfStockToggle({ product }) {
  const toggleMut = useToggleOutOfStock();
  const isOverride = !!product.isOutOfStock;

  const handleToggle = () => {
    toggleMut.mutate({ id: product._id, isOutOfStock: !isOverride });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggleMut.isPending}
      title={isOverride ? 'Click to mark as In Stock' : 'Click to force Out of Stock'}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
        isOverride
          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
          : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
      } ${toggleMut.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isOverride
        ? <FiToggleRight className="w-3.5 h-3.5" />
        : <FiToggleLeft className="w-3.5 h-3.5" />
      }
      {isOverride ? 'Out of Stock' : 'In Stock'}
    </button>
  );
}

function StockMovementsPanel({ productId, productName, onClose }) {
  const { data, isLoading: loading } = useStockMovements(productId);
  const movements = data?.movements || data || [];

  const typeColors = {
    sale: 'text-red-600 bg-red-50',
    cancellation: 'text-green-600 bg-green-50',
    manual_adjustment: 'text-blue-600 bg-blue-50',
    return: 'text-purple-600 bg-purple-50',
    payment_failed: 'text-amber-600 bg-amber-50',
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-100">
          <div>
            <h3 className="font-bold text-primary-900">Stock History</h3>
            <p className="text-xs text-primary-500">{productName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary-100 rounded-lg"><FiX className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><FiRefreshCw className="w-5 h-5 animate-spin text-primary-400" /></div>
          ) : movements.length === 0 ? (
            <p className="text-center text-primary-400 py-8">No stock movements recorded</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m, i) => (
                <div key={m._id || i} className="flex items-start gap-3 p-3 rounded-lg bg-primary-50">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[m.type] || 'text-primary-600 bg-primary-100'}`}>
                    {m.type?.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                      {m.size && <span className="text-xs text-primary-400">Size: {m.size}</span>}
                    </div>
                    {m.note && <p className="text-xs text-primary-500 mt-0.5">{m.note}</p>}
                    {m.orderCode && <p className="text-xs text-primary-400">Order: {m.orderCode}</p>}
                  </div>
                  <span className="text-xs text-primary-400 flex-shrink-0">
                    {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { data: inventoryData, isLoading: loading, refetch } = useInventory();
  const products = useMemo(() => {
    const d = inventoryData?.products || inventoryData || [];
    return Array.isArray(d) ? d : [];
  }, [inventoryData]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortField, setSortField] = useState('stock');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedMovements, setSelectedMovements] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Computed stats
  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => p.stock <= 0 || p.isOutOfStock).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10 && !p.isOutOfStock).length;
    const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0);
    return { total, outOfStock, lowStock, totalUnits, totalValue };
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category?.name || p.category).filter(Boolean));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  // Filter + Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (stockFilter === 'out') result = result.filter(p => p.stock <= 0 || p.isOutOfStock);
    else if (stockFilter === 'low') result = result.filter(p => p.stock > 0 && p.stock <= 10 && !p.isOutOfStock);
    else if (stockFilter === 'healthy') result = result.filter(p => p.stock > 10 && !p.isOutOfStock);

    if (categoryFilter !== 'all') result = result.filter(p => (p.category?.name || p.category) === categoryFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        (p.category?.name || p.category || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
    });

    return result;
  }, [products, stockFilter, categoryFilter, searchQuery, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'stock' ? 'asc' : 'desc'); }
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-xs opacity-50">{sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  );

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Inventory</h1>
            <p className="text-sm text-primary-500 mt-1">Monitor stock levels and track movements</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-primary-200 p-4">
            <div className="flex items-center gap-2 text-primary-500 text-xs mb-1"><FiPackage className="w-4 h-4" /> Products</div>
            <p className="text-2xl font-bold text-primary-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-2 text-red-500 text-xs mb-1"><FiAlertTriangle className="w-4 h-4" /> Out of Stock</div>
            <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 text-amber-500 text-xs mb-1"><FiTrendingDown className="w-4 h-4" /> Low Stock</div>
            <p className="text-2xl font-bold text-amber-700">{stats.lowStock}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <div className="flex items-center gap-2 text-blue-500 text-xs mb-1"><FiBox className="w-4 h-4" /> Total Units</div>
            <p className="text-2xl font-bold text-blue-700">{stats.totalUnits.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-green-500 text-xs mb-1"><FiDatabase className="w-4 h-4" /> Stock Value</div>
            <p className="text-xl font-bold text-green-700">{formatPrice(stats.totalValue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-primary-200 p-3 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, SKU, or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STOCK_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStockFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  stockFilter === f.key ? 'bg-primary-900 text-white' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span className="ml-1 opacity-70">
                    ({f.key === 'out' ? stats.outOfStock : f.key === 'low' ? stats.lowStock : stats.total - stats.outOfStock - stats.lowStock})
                  </span>
                )}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900 bg-white"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-primary-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><FiRefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary-50 border-b border-primary-200 text-left">
                    <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('name')}>
                      Product<SortIcon field="name" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-primary-700">SKU</th>
                    <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('category')}>
                      Category<SortIcon field="category" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('price')}>
                      Price<SortIcon field="price" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-primary-700 cursor-pointer select-none" onClick={() => handleSort('stock')}>
                      Stock<SortIcon field="stock" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-primary-700">Sizes</th>
                    <th className="px-4 py-3 font-semibold text-primary-700">Status</th>
                    <th className="px-4 py-3 font-semibold text-primary-700 text-center">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-primary-500">No products match the current filters</td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => {
                      const img = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url;
                      return (
                        <tr key={product._id} className="hover:bg-primary-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {img ? (
                                <img src={img} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                  <FiPackage className="w-4 h-4 text-primary-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-primary-900 truncate max-w-[200px]">{product.name}</p>
                                {product.brand && <p className="text-xs text-primary-400">{product.brand}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-primary-500">
                            {product.sku || '—'}
                          </td>
                          <td className="px-4 py-3 capitalize text-primary-600">{product.category?.name || product.category}</td>
                          <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <InlineStockEditor product={product} />
                              <StockBadge stock={product.stock} isOutOfStock={product.isOutOfStock} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product.sizes?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {product.sizes.map((s, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                      s.stock <= 0 ? 'bg-red-100 text-red-600' :
                                      s.stock <= 3 ? 'bg-amber-100 text-amber-600' :
                                      'bg-primary-100 text-primary-600'
                                    }`}
                                    title={`Size ${s.size}: ${s.stock} units`}
                                  >
                                    {s.size}:{s.stock}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-primary-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="text-xs text-primary-600">{product.isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                              <OutOfStockToggle product={product} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedMovements(product)}
                              className="p-1.5 text-primary-500 hover:bg-primary-100 rounded-lg transition-colors"
                              title="View stock movements"
                            >
                              <FiClock className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-primary-400 mt-3 text-center">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Stock Movements Modal */}
      {selectedMovements && (
        <StockMovementsPanel
          productId={selectedMovements._id}
          productName={selectedMovements.name}
          onClose={() => setSelectedMovements(null)}
        />
      )}
    </div>
  );
}
