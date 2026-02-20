import { useState } from 'react';
import Image from 'next/image';
import {
    FiChevronUp,
    FiChevronDown,
    FiEye,
    FiEyeOff,
    FiStar,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX,
    FiChevronRight,
    FiAlertCircle,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/helpers';
import { useUpdateProductStock } from '@/hooks/useProducts';

/* ── Health Score ──────────────────────────────────────────── */
function computeHealth(p) {
  let score = 0;
  const checks = [];
  // 1. Images (20)
  const hasImages = p.images?.length > 0;
  if (hasImages) score += 20; else checks.push('No images');
  // 2. Description (20)
  const hasDesc = (p.description?.length || 0) > 20;
  if (hasDesc) score += 20; else checks.push('Short/no description');
  // 3. Pricing (20)
  const hasPricing = p.price > 0;
  if (hasPricing) score += 20; else checks.push('No price set');
  // 4. Stock (20)
  const hasStock = p.stock > 0 || p.sizes?.some(s => s.stock > 0);
  if (hasStock) score += 20; else checks.push('Out of stock');
  // 5. Category (20)
  const hasCat = !!p.category;
  if (hasCat) score += 20; else checks.push('No category');
  return { score, checks };
}

function HealthBadge({ score, checks }) {
  const color = score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';
  const ring = score >= 80 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 10;
  const dashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="group relative flex items-center gap-1.5">
      <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
        <circle cx="14" cy="14" r="10" fill="none" className="stroke-gray-200" strokeWidth="3" />
        <circle cx="14" cy="14" r="10" fill="none" className={ring} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={dashoffset}
          strokeLinecap="round" transform="rotate(-90 14 14)" />
        <text x="14" y="14" textAnchor="middle" dominantBaseline="central" className="fill-gray-700 text-[8px] font-bold">{score}</text>
      </svg>
      {checks.length > 0 && (
        <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-20">
          {checks.map((c, i) => <div key={i} className="flex items-center gap-1"><FiAlertCircle className="w-3 h-3 text-amber-400" /> {c}</div>)}
        </div>
      )}
    </div>
  );
}

/* ── Inline Stock Editor ──────────────────────────────────── */
function StockEditor({ product }) {
  const [expanded, setExpanded] = useState(false);
  const [editSizes, setEditSizes] = useState(null);
  const stockMutation = useUpdateProductStock();

  const startEdit = () => {
    setExpanded(true);
    setEditSizes((product.sizes || []).map(s => ({ ...s })));
  };

  const cancelEdit = () => { setExpanded(false); setEditSizes(null); };

  const handleSave = () => {
    if (!editSizes) return;
    const totalStock = editSizes.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);
    stockMutation.mutate({ id: product._id, sizes: editSizes, stock: totalStock }, { onSuccess: () => cancelEdit() });
  };

  const updateSize = (idx, val) => {
    setEditSizes(prev => prev.map((s, i) => i === idx ? { ...s, stock: parseInt(val) || 0 } : s));
  };

  const hasSizes = product.sizes && product.sizes.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-medium ${product.stock <= 10 ? 'text-red-600' : product.stock <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {product.stock}
        </span>
        {hasSizes && (
          <button onClick={expanded ? cancelEdit : startEdit}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
            <FiChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
      {expanded && editSizes && (
        <div className="mt-2 bg-gray-50 rounded-lg p-2.5 space-y-1.5 min-w-[140px]">
          {editSizes.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 w-8 text-right font-medium">{s.size}</span>
              <input
                type="number" min="0" value={s.stock}
                onChange={(e) => updateSize(i, e.target.value)}
                className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          ))}
          <div className="flex gap-1 pt-1.5 border-t border-gray-200">
            <button onClick={handleSave} disabled={stockMutation.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-900 text-white text-[11px] font-medium py-1 rounded hover:bg-gray-800 disabled:opacity-50">
              <FiCheck className="w-3 h-3" /> Save
            </button>
            <button onClick={cancelEdit}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-white text-gray-600 text-[11px] font-medium py-1 rounded border border-gray-200 hover:bg-gray-50">
              <FiX className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductTable({
    products,
    loading,
    selectedProducts,
    handleSelectAll,
    handleSelectRow,
    sortBy,
    sortOrder,
    handleSort,
    handleToggleStatus,
    handleToggleFeatured,
    handleDeleteProduct
}) {
    const router = useRouter();

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-12 text-center">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-12 text-center text-primary-600">
                    No products found matching your filters.
                </div>
            </div>
        );
    }

    return (
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
                            <th className="px-4 py-4 text-left text-sm font-semibold text-primary-900">Health</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-primary-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200">
                        {products.map((product) => (
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
                                                src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.svg'}
                                                alt={product.name}
                                                fill
                                                sizes="48px"
                                                className="object-cover rounded border border-primary-200"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-primary-900 line-clamp-1">{product.name}</p>
                                            <p className="text-sm text-primary-600">{product.category?.name || product.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-primary-700 font-medium">
                                    {product.brand || '-'}
                                </td>
                                <td className="px-6 py-4 text-primary-900 font-semibold">{formatPrice(product.price ?? 0)}</td>
                                <td className="px-6 py-4">
                                    <StockEditor product={product} />
                                </td>
                                <td className="px-4 py-4">
                                    {(() => { const h = computeHealth(product); return <HealthBadge score={h.score} checks={h.checks} />; })()}
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
