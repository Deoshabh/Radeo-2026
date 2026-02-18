'use client';

import { useState, useMemo } from 'react';
import {
  useCmsPages, useCmsMedia, useCmsMenus, useOrphanedMedia,
  useCreateCmsPage, useUpdateCmsPage, useDeleteCmsPage, usePublishCmsPage,
  useDeleteOrphanedMedia, useCreateCmsMenu, useUpdateCmsMedia,
} from '@/hooks/useAdmin';
import toast from 'react-hot-toast';
import {
  FiFileText, FiImage, FiMenu, FiPlus, FiEdit2, FiTrash2,
  FiRefreshCw, FiSearch, FiSend, FiX
} from 'react-icons/fi';

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-700',
  review: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-primary-100 text-primary-500',
};

const TAB_CONFIG = [
  { key: 'pages', label: 'Pages', icon: FiFileText },
  { key: 'media', label: 'Media', icon: FiImage },
  { key: 'menus', label: 'Menus', icon: FiMenu },
];

// ====== Page Editor Modal ======
function PageEditorModal({ page, onClose }) {
  const createPageMut = useCreateCmsPage();
  const updatePageMut = useUpdateCmsPage();
  const [form, setForm] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    path: page?.path || '/',
    status: page?.status || 'draft',
    category: page?.category || 'page',
    template: page?.template || 'default',
    metaTitle: page?.metaTitle || '',
    metaDescription: page?.metaDescription || '',
    noIndex: page?.noIndex || false,
  });

  const saving = createPageMut.isPending || updatePageMut.isPending;

  const autoSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleTitleChange = (title) => {
    setForm(f => ({
      ...f,
      title,
      slug: page?._id ? f.slug : autoSlug(title),
      path: page?._id ? f.path : `/${autoSlug(title)}`,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (page?._id) {
      updatePageMut.mutate({ id: page._id, data: form }, { onSuccess: onClose });
    } else {
      createPageMut.mutate(form, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <h3 className="font-bold text-primary-900 text-lg">{page?._id ? 'Edit Page' : 'New Page'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-primary-100 rounded-lg"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-primary-600 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Path</label>
              <input type="text" value={form.path} onChange={(e) => setForm(f => ({ ...f, path: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900">
                {['page', 'post', 'faq', 'policy', 'help', 'custom'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Template</label>
              <select value={form.template} onChange={(e) => setForm(f => ({ ...f, template: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900">
                {['default', 'full-width', 'sidebar-left', 'sidebar-right'].map(t => (
                  <option key={t} value={t}>{t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900">
                {['draft', 'review', 'published', 'archived'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="border-t border-primary-100 pt-4 mt-4 space-y-3">
            <h4 className="text-sm font-semibold text-primary-700">SEO</h4>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Meta Title <span className="text-primary-400">({form.metaTitle.length}/60)</span></label>
              <input type="text" value={form.metaTitle} onChange={(e) => setForm(f => ({ ...f, metaTitle: e.target.value }))} maxLength={60}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-primary-600 mb-1">Meta Description <span className="text-primary-400">({form.metaDescription.length}/160)</span></label>
              <textarea value={form.metaDescription} onChange={(e) => setForm(f => ({ ...f, metaDescription: e.target.value }))} maxLength={160} rows={2}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.noIndex} onChange={(e) => setForm(f => ({ ...f, noIndex: e.target.checked }))}
                className="rounded border-primary-300 text-primary-900 focus:ring-primary-900" />
              <span className="text-sm text-primary-700">noindex (hide from search engines)</span>
            </label>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
              {saving ? 'Saving...' : page?._id ? 'Update Page' : 'Create Page'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-primary-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====== Menu Editor Modal ======
function MenuEditorModal({ onClose }) {
  const createMenuMut = useCreateCmsMenu();
  const [form, setForm] = useState({ name: '', location: 'header' });

  const saving = createMenuMut.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    createMenuMut.mutate(form, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <h3 className="font-bold text-primary-900">New Menu</h3>
          <button onClick={onClose} className="p-2 hover:bg-primary-100 rounded-lg"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-primary-600 mb-1">Menu Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-600 mb-1">Location</label>
            <select value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900">
              {['header', 'footer', 'sidebar', 'mobile', 'social', 'quicklinks', 'custom'].map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Menu'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-primary-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState('pages');
  const [pageSearch, setPageSearch] = useState('');
  const [pageStatus, setPageStatus] = useState('');
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaPage, setMediaPage] = useState(1);
  const [showMenuEditor, setShowMenuEditor] = useState(false);

  // ── Queries ──
  const pagesParams = useMemo(() => {
    const p = {};
    if (pageSearch.trim()) p.search = pageSearch;
    if (pageStatus) p.status = pageStatus;
    return p;
  }, [pageSearch, pageStatus]);
  const { data: pagesData, isLoading: pagesLoading } = useCmsPages(pagesParams);
  const pages = pagesData?.pages || pagesData || [];

  const mediaParams = useMemo(() => {
    const p = { page: mediaPage, limit: 20 };
    if (mediaSearch.trim()) p.search = mediaSearch;
    return p;
  }, [mediaPage, mediaSearch]);
  const { data: mediaData, isLoading: mediaLoading, refetch: refetchMedia } = useCmsMedia(mediaParams);
  const media = mediaData?.media || mediaData || [];
  const mediaPagination = mediaData?.pagination || { page: 1, totalPages: 1 };

  const { data: menusData, isLoading: menusLoading } = useCmsMenus();
  const menus = menusData?.menus || menusData || [];

  const { data: orphanedMedia } = useOrphanedMedia();

  // ── Mutations ──
  const deleteMut = useDeleteCmsPage();
  const publishMut = usePublishCmsPage();
  const deleteOrphanedMut = useDeleteOrphanedMedia();
  const updateMediaMut = useUpdateCmsMedia();

  const [editingMedia, setEditingMedia] = useState(null);
  const [mediaForm, setMediaForm] = useState({ altText: '', caption: '', credit: '' });

  const openMediaEditor = (item) => {
    setEditingMedia(item);
    setMediaForm({ altText: item.altText || '', caption: item.caption || '', credit: item.credit || '' });
  };

  const handleSaveMedia = () => {
    if (!editingMedia) return;
    updateMediaMut.mutate({ id: editingMedia._id, data: mediaForm }, {
      onSuccess: () => setEditingMedia(null),
    });
  };

  const handleDeletePage = (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMut.mutate(id);
  };

  const handlePublishPage = (id) => { publishMut.mutate(id); };

  const handleCleanOrphaned = () => {
    if (!orphanedMedia?.media?.length) return;
    if (!confirm(`Delete ${orphanedMedia.count} orphaned media files?`)) return;
    deleteOrphanedMut.mutate(orphanedMedia.media.map(m => m._id));
  };

  const closePageEditor = () => { setShowPageEditor(false); setEditingPage(null); };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">Content Management</h1>
            <p className="text-sm text-primary-500 mt-1">Manage pages, media library, and navigation menus</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg border border-primary-200 p-1 mb-6 w-fit">
          {TAB_CONFIG.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-primary-900 text-white' : 'text-primary-600 hover:bg-primary-50'
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div>
            <div className="bg-white rounded-lg border border-primary-200 p-3 mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4" />
                <input type="text" placeholder="Search pages..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900" />
              </div>
              <select value={pageStatus} onChange={(e) => setPageStatus(e.target.value)}
                className="px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-900">
                <option value="">All Statuses</option>
                {['draft', 'review', 'published', 'archived'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button onClick={() => { setEditingPage(null); setShowPageEditor(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800">
                <FiPlus className="w-4 h-4" /> New Page
              </button>
            </div>

            <div className="bg-white rounded-lg border border-primary-200 overflow-hidden">
              {pagesLoading ? (
                <div className="flex justify-center py-16"><FiRefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>
              ) : pages.length === 0 ? (
                <p className="text-center text-primary-400 py-12">No pages found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary-50 border-b border-primary-200 text-left">
                      <th className="px-5 py-3 font-semibold text-primary-700">Title</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Path</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Category</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Status</th>
                      <th className="px-5 py-3 font-semibold text-primary-700">Updated</th>
                      <th className="px-5 py-3 font-semibold text-primary-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {pages.map(page => (
                      <tr key={page._id} className="hover:bg-primary-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-primary-900">{page.title}</p>
                          <p className="text-xs text-primary-400 font-mono">{page.slug}</p>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-primary-500">{page.path}</td>
                        <td className="px-5 py-3 capitalize text-primary-600">{page.category}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[page.status] || STATUS_COLORS.draft}`}>{page.status}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-primary-400">
                          {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {page.status !== 'published' && (
                              <button onClick={() => handlePublishPage(page._id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Publish">
                                <FiSend className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => { setEditingPage(page); setShowPageEditor(true); }} className="p-1.5 text-primary-500 hover:bg-primary-100 rounded-lg" title="Edit">
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePage(page._id, page.title)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
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
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div>
            {orphanedMedia && orphanedMedia.count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">{orphanedMedia.count} orphaned media file{orphanedMedia.count > 1 ? 's' : ''} ({orphanedMedia.totalSizeHuman || formatFileSize(orphanedMedia.totalSizeBytes)})</p>
                  <p className="text-xs text-amber-600 mt-0.5">Unused files older than 30 days</p>
                </div>
                <button onClick={handleCleanOrphaned} disabled={deleteOrphanedMut.isPending}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                  {deleteOrphanedMut.isPending ? 'Cleaning...' : 'Clean Up'}
                </button>
              </div>
            )}
            <div className="bg-white rounded-lg border border-primary-200 p-3 mb-4 flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4" />
                <input type="text" placeholder="Search media..." value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900" />
              </div>
              <button onClick={() => refetchMedia()} className="px-4 py-2 border border-primary-200 rounded-lg text-sm hover:bg-primary-50">
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-lg border border-primary-200 overflow-hidden">
              {mediaLoading ? (
                <div className="flex justify-center py-16"><FiRefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>
              ) : media.length === 0 ? (
                <p className="text-center text-primary-400 py-12">No media files found</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                    {media.map(item => (
                      <div key={item._id} className="group relative border border-primary-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {item.type === 'image' ? (
                          <div className="aspect-square bg-primary-50">
                            <img src={item.cdnUrl || item.storageUrl || item.thumbnailUrl} alt={item.altText || item.originalName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-primary-100 flex items-center justify-center">
                            <FiFileText className="w-8 h-8 text-primary-400" />
                          </div>
                        )}
                        <button onClick={() => openMediaEditor(item)}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                          title="Edit metadata">
                          <FiEdit2 className="w-3.5 h-3.5 text-primary-700" />
                        </button>
                        <div className="p-2">
                          <p className="text-xs font-medium text-primary-900 truncate">{item.originalName}</p>
                          {item.altText && <p className="text-[10px] text-primary-500 truncate mt-0.5">{item.altText}</p>}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-primary-400">{formatFileSize(item.fileSize)}</span>
                            {item.width && <span className="text-[10px] text-primary-400">{item.width}x{item.height}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {mediaPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-primary-100">
                      {Array.from({ length: mediaPagination.totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setMediaPage(p)}
                          className={`w-8 h-8 rounded text-sm ${mediaPagination.page === p ? 'bg-primary-900 text-white' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}>{p}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Media Edit Modal */}
            {editingMedia && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="flex items-center justify-between p-4 border-b border-primary-200">
                    <h3 className="text-lg font-bold text-primary-900">Edit Media Metadata</h3>
                    <button onClick={() => setEditingMedia(null)} className="p-1.5 hover:bg-primary-100 rounded-lg"><FiX className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 space-y-3">
                    {editingMedia.type === 'image' && (
                      <img src={editingMedia.cdnUrl || editingMedia.storageUrl} alt="" className="w-full h-32 object-cover rounded-lg bg-primary-50" />
                    )}
                    <p className="text-xs text-primary-500 truncate">{editingMedia.originalName}</p>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-1">Alt Text</label>
                      <input type="text" value={mediaForm.altText} onChange={e => setMediaForm(f => ({ ...f, altText: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                        placeholder="Describe the image for accessibility" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-1">Caption</label>
                      <input type="text" value={mediaForm.caption} onChange={e => setMediaForm(f => ({ ...f, caption: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                        placeholder="Optional caption text" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-1">Credit</label>
                      <input type="text" value={mediaForm.credit} onChange={e => setMediaForm(f => ({ ...f, credit: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-900"
                        placeholder="Photo credit / source" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleSaveMedia} disabled={updateMediaMut.isPending}
                        className="flex-1 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50">
                        {updateMediaMut.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingMedia(null)}
                        className="flex-1 px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium hover:bg-primary-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menus Tab */}
        {activeTab === 'menus' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowMenuEditor(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800">
                <FiPlus className="w-4 h-4" /> New Menu
              </button>
            </div>
            <div className="bg-white rounded-lg border border-primary-200 overflow-hidden">
              {menusLoading ? (
                <div className="flex justify-center py-16"><FiRefreshCw className="w-6 h-6 animate-spin text-primary-400" /></div>
              ) : menus.length === 0 ? (
                <p className="text-center text-primary-400 py-12">No menus created yet</p>
              ) : (
                <div className="divide-y divide-primary-100">
                  {menus.map(menu => (
                    <div key={menu._id} className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-primary-900">{menu.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">{menu.location}</span>
                            <span className="text-xs text-primary-400">{menu.items?.length || 0} items</span>
                            {menu.slug && <span className="text-xs font-mono text-primary-400">{menu.slug}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${menu.isActive ? 'bg-green-500' : 'bg-primary-300'}`} />
                          <span className="text-xs text-primary-500">{menu.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      {menu.items?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {menu.items.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-primary-50 rounded text-xs text-primary-700 border border-primary-200">{item.label || item.url || 'Item'}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showPageEditor && (
        <PageEditorModal page={editingPage} onClose={closePageEditor} />
      )}
      {showMenuEditor && (
        <MenuEditorModal onClose={() => setShowMenuEditor(false)} />
      )}
    </div>
  );
}