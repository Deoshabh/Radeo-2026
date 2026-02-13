'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/utils/api';
import { FiSave, FiX, FiRefreshCw, FiSearch, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function BulkProductEditor() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modifiedRows, setModifiedRows] = useState(new Set());
    const [edits, setEdits] = useState({}); // { productId: { field: value } }
    const [search, setSearch] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all products (pagination handling might be needed for large datasets)
            // For now, assuming standard fetch returns a list or standard object
            const data = await adminAPI.getProducts({ limit: 100 });
            // Adjust based on actual API response structure (data.products or data)
            setProducts(data.products || data || []);
            setEdits({});
            setModifiedRows(new Set());
        } catch (error) {
            console.error('Failed to fetch products', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleChange = (id, field, value) => {
        setEdits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
        setModifiedRows(prev => new Set(prev).add(id));
    };

    const getDisplayValue = (product, field) => {
        if (edits[product._id] && edits[product._id][field] !== undefined) {
            return edits[product._id][field];
        }
        return product[field];
    };

    const handleSave = async () => {
        if (modifiedRows.size === 0) return;

        setSaving(true);
        const toastId = toast.loading('Saving changes...');

        try {
            const updates = Array.from(modifiedRows).map(id => {
                const productUpdates = edits[id];
                return adminAPI.updateProduct(id, productUpdates);
            });

            await Promise.all(updates);

            toast.success('All changes saved!', { id: toastId });
            fetchProducts(); // Refresh data
        } catch (error) {
            console.error('Bulk save error', error);
            toast.error('Failed to save some changes', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const hasUnsavedChanges = modifiedRows.size > 0;

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading products...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <span className="text-sm text-gray-500">
                        {filteredProducts.length} products
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1 animate-pulse">
                            <FiAlertCircle /> Unsaved changes ({modifiedRows.size})
                        </span>
                    )}
                    <button
                        onClick={fetchProducts}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                        title="Refresh"
                        disabled={saving}
                    >
                        <FiRefreshCw className={saving ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || saving}
                        className={`btn flex items-center gap-2 ${hasUnsavedChanges ? 'btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        <FiSave /> {saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 w-16">Image</th>
                            <th className="px-4 py-3 min-w-[200px]">Product Name</th>
                            <th className="px-4 py-3 w-32">Price ($)</th>
                            <th className="px-4 py-3 w-32">Stock</th>
                            <th className="px-4 py-3 w-40">Category</th>
                            <th className="px-4 py-3 w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map(product => {
                            const isModified = modifiedRows.has(product._id);
                            return (
                                <tr
                                    key={product._id}
                                    className={`hover:bg-gray-50 transition-colors ${isModified ? 'bg-amber-50' : ''}`}
                                >
                                    <td className="px-4 py-2">
                                        <div className="w-10 h-10 relative bg-gray-100 rounded border border-gray-200 overflow-hidden">
                                            {product.images && product.images[0] ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-gray-400">N/A</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={getDisplayValue(product, 'name')}
                                            onChange={(e) => handleChange(product._id, 'name', e.target.value)}
                                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={getDisplayValue(product, 'price')}
                                            onChange={(e) => handleChange(product._id, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all font-mono"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={getDisplayValue(product, 'stock')}
                                            onChange={(e) => handleChange(product._id, 'stock', parseInt(e.target.value) || 0)}
                                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all font-mono"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={getDisplayValue(product, 'category')}
                                            onChange={(e) => handleChange(product._id, 'category', e.target.value)}
                                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all text-gray-600"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <select
                                            value={getDisplayValue(product, 'status') || 'active'} // Handle missing status
                                            onChange={(e) => handleChange(product._id, 'status', e.target.value)}
                                            className="px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded transition-all text-xs"
                                        >
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredProducts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No products found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    );
}
