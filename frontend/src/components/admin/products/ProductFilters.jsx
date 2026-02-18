import { FiSearch } from 'react-icons/fi';

export default function ProductFilters({
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterBrand,
    setFilterBrand,
    filterStock,
    setFilterStock,
    filterStatus,
    setFilterStatus,
    categories = [],
    brands = []
}) {
    return (
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
                        {brands.map((brand, index) => (
                            <option key={brand || index} value={brand}>{brand}</option>
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
    );
}
