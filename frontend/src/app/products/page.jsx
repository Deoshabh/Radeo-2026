'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productAPI, categoryAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import { FiFilter, FiX } from 'react-icons/fi';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Get filters from URL
    const category = searchParams.get('category') || '';
    const price = searchParams.get('price') || '';
    const sort = searchParams.get('sort') || 'featured';
    const search = searchParams.get('search') || '';

    setSelectedCategory(category);
    setPriceRange(price);
    setSortBy(sort);
    setSearchQuery(search);

    fetchProducts(category, price, sort, search);
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async (category, price, sort, search) => {
    try {
      setLoading(true);
      const params = {};
      
      if (category) params.category = category;
      if (search) params.search = search;
      
      // Price range filter
      if (price) {
        const ranges = {
          'under-5000': { max: 5000 },
          '5000-10000': { min: 5000, max: 10000 },
          '10000-15000': { min: 10000, max: 15000 },
          '15000-20000': { min: 15000, max: 20000 },
          'above-20000': { min: 20000 },
        };
        
        if (ranges[price]) {
          if (ranges[price].min) params.minPrice = ranges[price].min;
          if (ranges[price].max) params.maxPrice = ranges[price].max;
        }
      }
      
      // Sorting
      if (sort && sort !== 'featured') {
        const sortMap = {
          'price-asc': { sortBy: 'price', order: 'asc' },
          'price-desc': { sortBy: 'price', order: 'desc' },
          'name-asc': { sortBy: 'name', order: 'asc' },
          'name-desc': { sortBy: 'name', order: 'desc' },
        };
        
        if (sortMap[sort]) {
          params.sortBy = sortMap[sort].sortBy;
          params.order = sortMap[sort].order;
        }
      }

      const response = await productAPI.getAllProducts(params);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const activeFilterCount = [selectedCategory, priceRange, searchQuery].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-primary-50 pt-24">
      <div className="container-custom section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-primary-600">
              {loading ? 'Loading...' : `${products.length} products found`}
            </p>
            
            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden btn btn-secondary flex items-center gap-2"
              >
                <FiFilter />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-brand-brown text-white text-xs px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilters('sort', e.target.value);
                }}
                className="px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-900"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-brand-brown hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={!selectedCategory}
                      onChange={() => updateFilters('category', '')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">All Products</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.slug}
                        onChange={() => updateFilters('category', category.slug)}
                        className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Price Range</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={!priceRange}
                      onChange={() => updateFilters('price', '')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">All Prices</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'under-5000'}
                      onChange={() => updateFilters('price', 'under-5000')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">Under ₹5,000</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === '5000-10000'}
                      onChange={() => updateFilters('price', '5000-10000')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">₹5,000 - ₹10,000</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === '10000-15000'}
                      onChange={() => updateFilters('price', '10000-15000')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">₹10,000 - ₹15,000</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === '15000-20000'}
                      onChange={() => updateFilters('price', '15000-20000')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">₹15,000 - ₹20,000</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'above-20000'}
                      onChange={() => updateFilters('price', 'above-20000')}
                      className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                    />
                    <span className="text-sm">Above ₹20,000</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Modal */}
          {isFilterOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in">
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto animate-slide-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)}>
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Same filter content as desktop */}
                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={!selectedCategory}
                        onChange={() => {
                          updateFilters('category', '');
                          setIsFilterOpen(false);
                        }}
                        className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                      />
                      <span className="text-sm">All Products</span>
                    </label>
                    {categories.map((category) => (
                      <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category-mobile"
                          checked={selectedCategory === category.slug}
                          onChange={() => {
                            updateFilters('category', category.slug);
                            setIsFilterOpen(false);
                          }}
                          className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {['', 'under-5000', '5000-10000', '10000-15000', '15000-20000', 'above-20000'].map((range, idx) => (
                      <label key={range} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price-mobile"
                          checked={priceRange === range}
                          onChange={() => {
                            updateFilters('price', range);
                            setIsFilterOpen(false);
                          }}
                          className="w-4 h-4 text-brand-brown focus:ring-brand-brown"
                        />
                        <span className="text-sm">
                          {idx === 0 ? 'All Prices' : 
                           idx === 1 ? 'Under ₹5,000' :
                           idx === 2 ? '₹5,000 - ₹10,000' :
                           idx === 3 ? '₹10,000 - ₹15,000' :
                           idx === 4 ? '₹15,000 - ₹20,000' : 'Above ₹20,000'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={clearFilters} className="w-full btn btn-secondary mb-4">
                  Clear All Filters
                </button>
                <button onClick={() => setIsFilterOpen(false)} className="w-full btn btn-primary">
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="spinner"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-primary-600 text-lg mb-4">No products found</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn btn-primary">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
