import Image from 'next/image';
import {
    FiChevronUp,
    FiChevronDown,
    FiEye,
    FiEyeOff,
    FiStar,
    FiEdit2,
    FiTrash2
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
