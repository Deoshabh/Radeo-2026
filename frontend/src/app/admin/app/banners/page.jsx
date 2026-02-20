'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiUploadCloud,
  FiChevronUp, FiChevronDown, FiEye, FiSmartphone, FiGlobe,
  FiCheck, FiArrowLeft,
} from 'react-icons/fi';
import Link from 'next/link';

const PLATFORM_LABELS = { app: 'App Only', web: 'Web Only', both: 'Both' };
const PLATFORM_COLORS = {
  app: 'bg-indigo-100 text-indigo-700',
  web: 'bg-blue-100 text-blue-700',
  both: 'bg-emerald-100 text-emerald-700',
};
const LINK_TYPES = ['none', 'product', 'category', 'url', 'screen'];

export default function AppBannersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBanner, setPreviewBanner] = useState(null);

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'app', 'banners'],
    queryFn: async () => {
      const res = await adminAPI.getAppBanners();
      return res.data?.data ?? [];
    },
    staleTime: 30_000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createAppBanner(data),
    onSuccess: () => {
      toast.success('Banner created');
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'banners'] });
      resetForm();
    },
    onError: () => toast.error('Failed to create banner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateAppBanner(id, data),
    onSuccess: () => {
      toast.success('Banner updated');
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'banners'] });
      resetForm();
    },
    onError: () => toast.error('Failed to update banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteAppBanner(id),
    onSuccess: () => {
      toast.success('Banner deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'banners'] });
    },
    onError: () => toast.error('Failed to delete banner'),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids) => adminAPI.reorderAppBanners(ids),
    onSuccess: () => {
      toast.success('Order saved');
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'banners'] });
    },
    onError: () => toast.error('Failed to reorder'),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingBanner(null);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this banner? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const ids = banners.map((b) => b._id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids);
  };

  const handleMoveDown = (index) => {
    if (index === banners.length - 1) return;
    const ids = banners.map((b) => b._id);
    [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
    reorderMutation.mutate(ids);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/app" className="text-gray-400 hover:text-gray-600 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">App Banners</h1>
              <p className="text-sm text-gray-500 mt-0.5">{banners.length} banner{banners.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingBanner(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add Banner
          </button>
        </div>

        {/* Banner Table */}
        {banners.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <FiImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No banners yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first app banner</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {banners.map((banner, idx) => (
                    <tr key={banner._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                            <FiChevronUp className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-400 text-center">{idx + 1}</span>
                          <button onClick={() => handleMoveDown(idx)} disabled={idx === banners.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                            <FiChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {banner.image?.url ? (
                          <img src={banner.image.url} alt="" className="w-24 h-12 object-cover rounded-lg border border-gray-100" />
                        ) : (
                          <div className="w-24 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FiImage className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{banner.title || '(No title)'}</p>
                        {banner.subtitle && <p className="text-xs text-gray-400 mt-0.5">{banner.subtitle}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[banner.platform] || PLATFORM_COLORS.both}`}>
                          {banner.platform === 'app' ? <FiSmartphone className="w-3 h-3" /> : banner.platform === 'web' ? <FiGlobe className="w-3 h-3" /> : null}
                          {PLATFORM_LABELS[banner.platform] || 'Both'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {banner.linkType === 'none' ? '—' : `${banner.linkType}: ${banner.linkValue || '—'}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setPreviewBanner(banner); setShowPreview(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Preview">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(banner)} className="p-1.5 text-gray-400 hover:text-primary-900 rounded-lg hover:bg-primary-50 transition-colors" title="Edit">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(banner._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Banner Form Modal */}
        {showForm && (
          <BannerFormModal
            banner={editingBanner}
            onClose={resetForm}
            onSubmit={(data) => {
              if (editingBanner) {
                updateMutation.mutate({ id: editingBanner._id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            saving={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* Preview Modal */}
        {showPreview && previewBanner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Mobile Preview</h3>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="p-4">
                <div className="w-[375px] max-w-full mx-auto bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  {previewBanner.image?.url ? (
                    <img src={previewBanner.image.url} alt="" className="w-full aspect-[16/7] object-cover" />
                  ) : (
                    <div className="w-full aspect-[16/7] bg-gray-200 flex items-center justify-center">
                      <FiImage className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  {(previewBanner.title || previewBanner.subtitle) && (
                    <div className="p-3">
                      {previewBanner.title && <p className="font-bold text-gray-900 text-sm">{previewBanner.title}</p>}
                      {previewBanner.subtitle && <p className="text-xs text-gray-500 mt-0.5">{previewBanner.subtitle}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Banner Form Modal ─────────────────────────────────
function BannerFormModal({ banner, onClose, onSubmit, saving }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    image: banner?.image || { url: '', key: '' },
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    linkType: banner?.linkType || 'none',
    linkValue: banner?.linkValue || '',
    platform: banner?.platform || 'both',
    isActive: banner?.isActive ?? true,
    order: banner?.order ?? 0,
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB');
      return;
    }
    try {
      setUploading(true);
      const { data } = await adminAPI.getUploadUrl({
        fileName: file.name,
        fileType: file.type,
        productSlug: 'app-banners',
      });
      if (!data.success) throw new Error(data.message);
      const { signedUrl, publicUrl } = data.data;
      await axios.put(signedUrl, file, { headers: { 'Content-Type': file.type } });
      update('image', { url: publicUrl, key: `app-banners/${file.name}` });
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!form.image.url) {
      toast.error('Please upload an image');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-semibold text-gray-900">{banner ? 'Edit Banner' : 'Add Banner'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Banner Image *</label>
            {form.image.url ? (
              <div className="relative group border rounded-lg overflow-hidden bg-gray-50">
                <img src={form.image.url} alt="" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => update('image', { url: '', key: '' })} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                    <FiX size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  uploading ? 'bg-gray-50 border-gray-300' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <input
                  type="file" ref={fileInputRef} className="hidden" accept="image/*"
                  onChange={handleImageUpload} disabled={uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <FiUploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload (max 5MB)</p>
                    <p className="text-xs text-gray-400 mt-1">Recommended: 1200×525 (16:7)</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Optional title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subtitle</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} placeholder="Optional subtitle"
              />
            </div>
          </div>

          {/* Link Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Link Type</label>
            <div className="flex flex-wrap gap-2">
              {LINK_TYPES.map((lt) => (
                <button
                  key={lt}
                  onClick={() => { update('linkType', lt); update('linkValue', ''); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    form.linkType === lt ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {lt.charAt(0).toUpperCase() + lt.slice(1)}
                </button>
              ))}
            </div>
            {form.linkType !== 'none' && (
              <input
                type="text"
                className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                value={form.linkValue} onChange={(e) => update('linkValue', e.target.value)}
                placeholder={form.linkType === 'url' ? 'https://...' : form.linkType === 'product' ? 'Product slug' : form.linkType === 'category' ? 'Category slug' : 'Screen name'}
              />
            )}
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Platform</label>
            <div className="flex gap-2">
              {['both', 'app', 'web'].map((p) => (
                <button
                  key={p}
                  onClick={() => update('platform', p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    form.platform === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <input type="checkbox" className="sr-only" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
              <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <FiCheck className="w-4 h-4" />
            {saving ? 'Saving...' : banner ? 'Update Banner' : 'Create Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
