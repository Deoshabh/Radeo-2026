'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import { useFilters, useDeleteFilter, useToggleFilterStatus } from '@/hooks/useAdmin';
import toast from 'react-hot-toast';
import {
  FiFilter, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX,
  FiRefreshCw, FiToggleLeft, FiToggleRight, FiMove,
  FiSearch, FiChevronDown, FiChevronUp
} from 'react-icons/fi';

const FILTER_TYPES = [
  { value: 'category', label: 'Category', color: 'bg-blue-100 text-blue-700' },
  { value: 'priceRange', label: 'Price Range', color: 'bg-green-100 text-green-700' },
  { value: 'size', label: 'Size', color: 'bg-purple-100 text-purple-700' },
  { value: 'color', label: 'Color', color: 'bg-pink-100 text-pink-700' },
  { value: 'material', label: 'Material', color: 'bg-amber-100 text-amber-700' },
];

function TypeBadge({ type }) {
  const config = FILTER_TYPES.find(t => t.value === type) || { label: type, color: 'bg-primary-100 text-primary-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
}

function FilterForm({ filter, onSave, onCancel }) {
  const [form, setForm] = useState({
    type: filter?.type || 'category',
    name: filter?.name || '',
    value: filter?.value || '',
    displayOrder: filter?.displayOrder ?? 0,
    isActive: filter?.isActive ?? true,
    minPrice: filter?.minPrice ?? '',
    maxPrice: filter?.maxPrice ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.value.trim()) {
      toast.error('Name and value are required');
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form, displayOrder: Number(form.displayOrder) };
      if (form.type === 'priceRange') {
        payload.minPrice = form.minPrice !== '' ? Number(form.minPrice) : 0;
        payload.maxPrice = form.maxPrice !== '' ? Number(form.maxPrice) : null;
      } else {
        delete payload.minPrice;
        delete payload.maxPrice;
      }
      if (filter?._id) {
        await adminAPI.updateFilter(filter._id, payload);
        toast.success('Filter updated');
      } else {
        await adminAPI.createFilter(payload);
        toast.success('Filter created');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save filter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-primary-200 p-5 space-y-4">
      <h3 className="font-bold text-primary-900">{filter?._id ? 'Edit Filter' : 'New Filter'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-primary-600 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900"
            disabled={!!filter?._id}
          >
            {FILTER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-600 mb-1">Name (Display)</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Red, Size 10, Under ₹2000"
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-600 mb-1">Value (Internal)</label>
          <input
            type="text"
            value={form.value}
            onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="e.g. red, 10, 0-2000"
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-600 mb-1">Display Order</label>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm(f => ({ ...f, displayOrder: e.target.value }))}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900"
            min="0"
          />
        </div>
        {form.type === 'priceRange' && (
          <>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Min Price (₹)</label>
              <input
                type="number"
                value={form.minPrice}
                onChange={(e) => setForm(f => ({ ...f, minPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Max Price (₹)</label>
              <input
                type="number"
                value={form.maxPrice}
                onChange={(e) => setForm(f => ({ ...f, maxPrice: e.target.value }))}
                placeholder="Leave empty for no limit"
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900"
                min="0"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
            className="rounded border-primary-300 text-primary-900 focus:ring-primary-900"
          />
          <span className="text-sm text-primary-700">Active</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 flex items-center gap-2"
        >
          <FiCheck className="w-4 h-4" />
          {saving ? 'Saving...' : filter?._id ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function FiltersPage() {
  const queryClient = useQueryClient();
  const { data: filtersRaw, isLoading: loading, refetch: fetchFilters } = useFilters();
  const filters = filtersRaw?.filters || filtersRaw || [];
  const deleteFilterMut = useDeleteFilter();
  const toggleFilterMut = useToggleFilterStatus();
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [expandedType, setExpandedType] = useState(null);

  const handleDelete = (id, name) => {
    if (!confirm(`Delete filter "${name}"? This cannot be undone.`)) return;
    deleteFilterMut.mutate(id);
  };

  const handleToggle = (id) => {
    toggleFilterMut.mutate(id);
  };

  const handleEdit = (filter) => {
    setEditingFilter(filter);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingFilter(null);
    queryClient.invalidateQueries({ queryKey: ['admin', 'filters'] });
  };

  // Group by type
  const groupedFilters = useMemo(() => {
    let list = [...filters];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => f.name?.toLowerCase().includes(q) || f.value?.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') {
      list = list.filter(f => f.type === typeFilter);
    }
    const groups = {};
    FILTER_TYPES.forEach(t => { groups[t.value] = []; });
    list.forEach(f => {
      if (groups[f.type]) groups[f.type].push(f);
      else groups[f.type] = [f];
    });
    // Sort by displayOrder within each group
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    });
    return groups;
  }, [filters, searchQuery, typeFilter]);

  const stats = useMemo(() => ({
    total: filters.length,
    active: filters.filter(f => f.isActive).length,
    inactive: filters.filter(f => !f.isActive).length,
    types: FILTER_TYPES.map(t => ({ ...t, count: filters.filter(f => f.type === t.value).length })),
  }), [filters]);

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Filters</h1>
            <p className="text-sm text-primary-500 mt-1">Manage product filter options shown on the storefront</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchFilters}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => { setEditingFilter(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800"
            >
              <FiPlus className="w-4 h-4" />
              Add Filter
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-primary-200 p-3 text-center">
            <p className="text-2xl font-bold text-primary-900">{stats.total}</p>
            <p className="text-xs text-primary-500">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-green-600">Active</p>
          </div>
          {stats.types.map(t => (
            <div key={t.value} className="bg-white rounded-xl border border-primary-200 p-3 text-center">
              <p className="text-2xl font-bold text-primary-900">{t.count}</p>
              <p className="text-xs text-primary-500">{t.label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6">
            <FilterForm
              filter={editingFilter}
              onSave={handleFormSave}
              onCancel={() => { setShowForm(false); setEditingFilter(null); }}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-primary-200 p-3 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search filters…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'all' ? 'bg-primary-900 text-white' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              }`}
            >
              All
            </button>
            {FILTER_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t.value ? 'bg-primary-900 text-white' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter groups */}
        {loading ? (
          <div className="flex justify-center py-16"><FiRefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>
        ) : (
          <div className="space-y-4">
            {FILTER_TYPES.map(type => {
              const items = groupedFilters[type.value] || [];
              if (typeFilter !== 'all' && typeFilter !== type.value) return null;
              if (items.length === 0 && typeFilter === 'all') return null;
              const isExpanded = expandedType === null || expandedType === type.value;

              return (
                <div key={type.value} className="bg-white rounded-lg border border-primary-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedType(expandedType === type.value ? null : type.value)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TypeBadge type={type.value} />
                      <span className="font-semibold text-primary-900">{type.label}</span>
                      <span className="text-xs text-primary-400">({items.length})</span>
                    </div>
                    {isExpanded ? <FiChevronUp className="w-4 h-4 text-primary-400" /> : <FiChevronDown className="w-4 h-4 text-primary-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-primary-100">
                      {items.length === 0 ? (
                        <p className="px-5 py-6 text-center text-primary-400 text-sm">No {type.label.toLowerCase()} filters</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-primary-50 text-left">
                              <th className="px-5 py-2 font-semibold text-primary-600">Name</th>
                              <th className="px-5 py-2 font-semibold text-primary-600">Value</th>
                              {type.value === 'priceRange' && (
                                <>
                                  <th className="px-5 py-2 font-semibold text-primary-600">Min</th>
                                  <th className="px-5 py-2 font-semibold text-primary-600">Max</th>
                                </>
                              )}
                              <th className="px-5 py-2 font-semibold text-primary-600 text-center">Order</th>
                              <th className="px-5 py-2 font-semibold text-primary-600 text-center">Status</th>
                              <th className="px-5 py-2 font-semibold text-primary-600 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary-100">
                            {items.map(f => (
                              <tr key={f._id} className={`hover:bg-primary-50 transition-colors ${!f.isActive ? 'opacity-50' : ''}`}>
                                <td className="px-5 py-3 font-medium text-primary-900">{f.name}</td>
                                <td className="px-5 py-3 font-mono text-xs text-primary-500">{f.value}</td>
                                {type.value === 'priceRange' && (
                                  <>
                                    <td className="px-5 py-3 text-primary-600">₹{f.minPrice ?? 0}</td>
                                    <td className="px-5 py-3 text-primary-600">{f.maxPrice != null ? `₹${f.maxPrice}` : '∞'}</td>
                                  </>
                                )}
                                <td className="px-5 py-3 text-center text-primary-500">{f.displayOrder}</td>
                                <td className="px-5 py-3 text-center">
                                  <button
                                    onClick={() => handleToggle(f._id)}
                                    className={`inline-flex items-center gap-1 text-xs font-medium ${f.isActive ? 'text-green-600' : 'text-primary-400'}`}
                                  >
                                    {f.isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                                    {f.isActive ? 'Active' : 'Off'}
                                  </button>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleEdit(f)}
                                      className="p-1.5 text-primary-500 hover:bg-primary-100 rounded-lg"
                                      title="Edit"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(f._id, f.name)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                      title="Delete"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
