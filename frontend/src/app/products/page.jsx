'use client';
// Rebuild trigger - v3
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productAPI, categoryAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import PriceRangeSlider from '@/components/PriceRangeSlider';
import { FiFilter, FiX } from 'react-icons/fi';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAllCategories();
      setCategories(Array.isArray(response.data) ? response.data : (response.data.categories || []));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await productAPI.getMaterials();
      console.log('📦 Materials API response:', response.data);
      setMaterials(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchPriceRange = async () => {
    try {
      const response = await productAPI.getPriceRange();
      console.log('📦 Price Range API response:', response.data);
      if (response.data) {
        setPriceRange(response.data);
        if (!selectedPriceRange) {
          setSelectedPriceRange(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch price range:', error);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await productAPI.getColors();
      console.log('📦 Colors API response:', response.data);
      setColors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch colors:', error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await productAPI.getSizes();
      console.log('📦 Sizes API response:', response.data);
      setSizes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchMaterials();
    fetchPriceRange();
    fetchColors();
    fetchSizes();
  }, []);

  const fetchProducts = useCallback(async (category, materials, colors, sizes, priceMin, priceMax, sort, search) => {
    try {
      setLoading(true);
      const params = {};
      
      if (category) params.category = category;
      if (search) params.search = search;
      if (materials && materials.length > 0) params.material = materials[0]; // Backend supports single material for now
      if (colors && colors.length > 0) params.color = colors[0]; // Backend supports single color for now
      if (sizes && sizes.length > 0) params.size = sizes[0]; // Backend supports single size for now
      
      // Price range filter
      if (priceMin !== undefined && priceMin !== null) {
        params.minPrice = priceMin;
      }
      if (priceMax !== undefined && priceMax !== null) {
        params.maxPrice = priceMax;
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
      console.log('📦 Products API response:', response.data);
      // Backend returns array directly, not wrapped in {products: [...]}
      const productsData = Array.isArray(response.data) ? response.data : (response.data.products || []);
      console.log(`✅ Loaded ${productsData.length} products`);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get filters from URL
    const category = searchParams.get('category') || '';
    const materialsParam = searchParams.get('materials') || '';
    const colorsParam = searchParams.get('colors') || '';
    const sizesParam = searchParams.get('sizes') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'featured';
    const search = searchParams.get('search') || '';

    setSelectedCategory(category);
    setSelectedMaterials(materialsParam ? materialsParam.split(',') : []);
    setSelectedColors(colorsParam ? colorsParam.split(',') : []);
    setSelectedSizes(sizesParam ? sizesParam.split(',') : []);
    setSortBy(sort);
    setSearchQuery(search);

    // Update price range from URL
    if (minPrice || maxPrice) {
      setSelectedPriceRange({
        min: minPrice ? Number(minPrice) : priceRange.min,
        max: maxPrice ? Number(maxPrice) : priceRange.max,
      });
    }

    fetchProducts(
      category, 
      materialsParam ? materialsParam.split(',') : [],
      colorsParam ? colorsParam.split(',') : [],
      sizesParam ? sizesParam.split(',') : [],
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      sort, 
      search
    );
  }, [searchParams, fetchProducts, priceRange]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value);
      }
    } else {
      params.delete(key);
    }
    
    router.push(`/products?${params.toString()}`);
  };

  const handlePriceChange = (newRange) => {
    setSelectedPriceRange(newRange);
    const params = new URLSearchParams(searchParams.toString());
    params.set('minPrice', newRange.min);
    params.set('maxPrice', newRange.max);
    router.push(`/products?${params.toString()}`);
  };

  const handleMaterialToggle = (material) => {
    const newMaterials = selectedMaterials.includes(material)
      ? selectedMaterials.filter(m => m !== material)
      : [...selectedMaterials, material];
    setSelectedMaterials(newMaterials);
    updateFilters('materials', newMaterials);
  };

  const handleColorToggle = (color) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter(c => c !== color)
      : [...selectedColors, color];
    setSelectedColors(newColors);
    updateFilters('colors', newColors);
  };

  const handleSizeToggle = (size) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(newSizes);
    updateFilters('sizes', newSizes);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const activeFilterCount = [
    selectedCategory,
    searchQuery,
    selectedMaterials.length > 0,
    selectedColors.length > 0,
    selectedSizes.length > 0,
    selectedPriceRange && (selectedPriceRange.min !== priceRange.min || selectedPriceRange.max !== priceRange.max)
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-primary-50 pt-8">
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
                <PriceRangeSlider
                  min={priceRange.min}
                  max={priceRange.max}
                  value={selectedPriceRange}
                  onChange={handlePriceChange}
                />
              </div>

              {/* Material Filter */}
              {materials.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Material</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {materials.map((material) => (
                      <label key={material} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(material)}
                          onChange={() => handleMaterialToggle(material)}
                          className="w-4 h-4 text-brand-brown focus:ring-brand-brown rounded"
                        />
                        <span className="text-sm">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Color</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {colors.map((color) => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color)}
                          onChange={() => handleColorToggle(color)}
                          className="w-4 h-4 text-brand-brown focus:ring-brand-brown rounded"
                        />
                        <span className="text-sm">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Size</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sizes.map((size) => (
                      <label key={size} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size)}
                          onChange={() => handleSizeToggle(size)}
                          className="w-4 h-4 text-brand-brown focus:ring-brand-brown rounded"
                        />
                        <span className="text-sm">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                  <PriceRangeSlider
                    min={priceRange.min}
                    max={priceRange.max}
                    value={selectedPriceRange}
                    onChange={(newRange) => {
                      handlePriceChange(newRange);
                      setIsFilterOpen(false);
                    }}
                  />
                </div>

                {/* Material Filter */}
                {materials.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Material</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {materials.map((material) => (
                        <label key={material} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMaterials.includes(material)}
                            onChange={() => handleMaterialToggle(material)}
                            className="w-4 h-4 text-brand-brown focus:ring-brand-brown rounded"
                          />
                          <span className="text-sm">{material}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Filter */}
                {colors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Color</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {colors.map((color) => (
                        <label key={color} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedColors.includes(color)}
                            onChange={() => handleColorToggle(color)}
                            className="w-4 h-4 text-brand-brown focus:ring-brand-brown rounded"
                          />
                          <span className="text-sm">{color}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Filter */}
                {sizes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Size</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sizes.map((size) => (
                        <label key={size} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSizes.includes(size)}
                            onChange={() => handleSizeToggle(size)}
                            className="w-4 h-4 text-brand-brown focus:ring-brand-brown rounded"
                          />
                          <span className="text-sm">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-primary-50 pt-24">
        <div className="container-custom section-padding">
          <div className="flex justify-center items-center py-20">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
