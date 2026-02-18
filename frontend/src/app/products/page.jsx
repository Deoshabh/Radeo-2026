'use client';
// Rebuild trigger - v4
import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productAPI, categoryAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import PriceRangeSlider from '@/components/PriceRangeSlider';
import { getColorName } from '@/components/ColorPicker';
import { FiFilter, FiX } from 'react-icons/fi';
import anime from 'animejs';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Refs for animation
  const containerRef = useRef(null);
  const headerRef = useRef(null);

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

  // ... (fetch functions remain same, omitted for brevity if unchanged, but likely need to keep them)
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
      // console.log('ðŸ“¦ Materials API response:', response.data);
      setMaterials(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchPriceRange = useCallback(async () => {
    try {
      const response = await productAPI.getPriceRange();
      // console.log('ðŸ“¦ Price Range API response:', response.data);
      if (response.data) {
        setPriceRange(response.data);
        setSelectedPriceRange((prev) => prev || response.data);
      }
    } catch (error) {
      console.error('Failed to fetch price range:', error);
    }
  }, []);

  const fetchColors = async () => {
    try {
      const response = await productAPI.getColors();
      // console.log('ðŸ“¦ Colors API response:', response.data);
      setColors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch colors:', error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await productAPI.getSizes();
      // console.log('ðŸ“¦ Sizes API response:', response.data);
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
  }, [fetchPriceRange]);

  const fetchProducts = useCallback(async (category, materials, colors, sizes, priceMin, priceMax, sort, search) => {
    try {
      setLoading(true);
      const params = {};

      if (category) params.category = category;
      if (search) params.search = search;
      if (materials && materials.length > 0) params.material = materials[0];
      if (colors && colors.length > 0) params.color = colors[0];
      if (sizes && sizes.length > 0) params.size = sizes[0];

      if (priceMin !== undefined && priceMin !== null) params.minPrice = priceMin;
      if (priceMax !== undefined && priceMax !== null) params.maxPrice = priceMax;

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
      // Backend returns array directly
      const productsData = Array.isArray(response.data) ? response.data : (response.data.products || []);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
  }, [searchParams, fetchProducts]);

  // Anime.js Animations
  useEffect(() => {
    // Animate Header on mount
    if (headerRef.current) {
      anime({
        targets: headerRef.current,
        opacity: [0, 1],
        translateY: [-20, 0],
        easing: 'easeOutQuad',
        duration: 800
      });
    }
  }, []);

  useEffect(() => {
    // Animate Products when list updates
    if (!loading && products.length > 0) {
      anime({
        targets: '.product-card-item',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(50), // stagger each card by 50ms
        easing: 'easeOutQuad',
        duration: 600
      });
    }
  }, [products, loading]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      if (Array.isArray(value)) params.set(key, value.join(','));
      else params.set(key, value);
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
    <div className="min-h-screen bg-[color:var(--color-page-bg)] pt-8 pb-20" ref={containerRef}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-10" ref={headerRef}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] text-[color:var(--color-body)] mb-3 uppercase tracking-[0.2em] font-medium" style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>Home / Products</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-[color:var(--color-heading)]" style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}>
                {searchQuery ? `Search: "${searchQuery}"` : 'Our Collection'}
              </h1>
            </div>
            <p className="text-[11px] text-[color:var(--color-body)] uppercase tracking-[0.15em] font-medium" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
              {loading ? 'Loading...' : `${products.length} Items Found`}
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-4 border border-[color:var(--color-border-light)]">

            {/* Left: Filter Toggle (Mobile) */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.15em] border border-[color:var(--color-heading)] text-[color:var(--color-heading)] hover:bg-[color:var(--color-heading)] hover:text-[color:var(--color-subtle-bg)] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
              >
                <FiFilter className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] text-[9px] w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Sort */}
            <div className="flex items-center gap-3 ml-auto">
              <label className="text-[11px] text-[color:var(--color-body)] uppercase tracking-[0.1em] hidden sm:block" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilters('sort', e.target.value);
                }}
                className="px-4 py-2 border border-[color:var(--color-border-light)] bg-transparent text-[color:var(--color-heading)] cursor-pointer hover:border-[color:var(--color-accent)] transition-colors focus:outline-none focus:border-[color:var(--color-accent)] text-sm"
                style={{ fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)" }}
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

        <div className="flex gap-8 items-start">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-32 transition-all duration-300">
            <div className="bg-white/80 backdrop-blur-sm border border-[color:var(--color-border-light)] p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[color:var(--color-border-light)]">
                <h3 className="text-sm font-semibold text-[color:var(--color-heading)] flex items-center gap-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                  <FiFilter className="w-4 h-4" /> Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] font-semibold text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-hover)] transition-colors uppercase tracking-[0.1em]"
                    style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <h4 className="text-[11px] font-semibold text-[color:var(--color-heading)] mb-4 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>Categories</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${!selectedCategory ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'}`}>
                      {!selectedCategory && <div className="w-2 h-2 bg-white" />}
                    </div>
                    <input
                      type="radio"
                      name="category"
                      checked={!selectedCategory}
                      onChange={() => updateFilters('category', '')}
                      className="hidden"
                    />
                    <span className={`text-sm transition-colors ${!selectedCategory ? 'font-medium' : ''}`} style={{ color: !selectedCategory ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>All Products</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedCategory === category.slug ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'}`}>
                        {selectedCategory === category.slug && <div className="w-2 h-2 bg-white" />}
                      </div>
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.slug}
                        onChange={() => updateFilters('category', category.slug)}
                        className="hidden"
                      />
                      <span className={`text-sm transition-colors ${selectedCategory === category.slug ? 'font-medium' : ''}`} style={{ color: selectedCategory === category.slug ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-8">
                <h4 className="text-[11px] font-semibold text-[color:var(--color-heading)] mb-4 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>Price Range</h4>
                <div className="px-2">
                  <PriceRangeSlider
                    min={priceRange.min}
                    max={priceRange.max}
                    value={selectedPriceRange}
                    onChange={handlePriceChange}
                  />
                </div>
              </div>

              {/* Material Filter */}
              {materials.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-[11px] font-semibold text-[color:var(--color-heading)] mb-4 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>Material</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {materials.map((material) => (
                      <label key={material} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedMaterials.includes(material) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'}`}>
                          {selectedMaterials.includes(material) && <FiX className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(material)}
                          onChange={() => handleMaterialToggle(material)}
                          className="hidden"
                        />
                        <span className="text-sm" style={{ color: selectedMaterials.includes(material) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {colors.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-[11px] font-semibold text-[color:var(--color-heading)] mb-4 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>Color</h4>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <label key={color} className="cursor-pointer group relative">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color)}
                          onChange={() => handleColorToggle(color)}
                          className="hidden"
                        />
                        <div
                          className="w-7 h-7 rounded-full transition-all duration-150"
                          style={{
                            backgroundColor: color,
                            border: selectedColors.includes(color) ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                            outline: selectedColors.includes(color) ? '2px solid var(--color-accent)' : 'none',
                            outlineOffset: '2px',
                            transform: selectedColors.includes(color) ? 'scale(1.1)' : 'scale(1)',
                          }}
                          title={getColorName(color)}
                        />
                        {selectedColors.includes(color) && (
                          <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                            <span className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" style={{ backgroundColor: color === '#FFFFFF' || color === '#ffffff' ? '#000' : '#fff' }}></span>
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {sizes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[color:var(--color-heading)] mb-4 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>Size</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((size) => (
                      <label key={size} className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size)}
                          onChange={() => handleSizeToggle(size)}
                          className="hidden"
                        />
                        <div
                          className="w-10 h-10 flex items-center justify-center text-xs font-mono transition-all duration-150"
                          style={{
                            border: selectedSizes.includes(size) ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                            backgroundColor: selectedSizes.includes(size) ? 'var(--color-accent)' : 'transparent',
                            color: selectedSizes.includes(size) ? '#fff' : 'var(--color-text-secondary)',
                          }}
                        >
                          {size}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Mobile Filter Modal */}
          {isFilterOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/40 z-50 backdrop-blur-sm">
              <div className="absolute right-0 top-0 bottom-0 w-80 overflow-y-auto" style={{ backgroundColor: 'var(--color-background)' }}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <h3 className="label-upper text-xs" style={{ color: 'var(--color-text-secondary)' }}>Filters</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="p-2 transition-opacity hover:opacity-60">
                      <FiX className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
                    </button>
                  </div>

                  <div className="space-y-8 pb-24">
                    <div>
                      <h4 className="label-upper text-[0.625rem] mb-3" style={{ color: 'var(--color-text-secondary)' }}>Categories</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 py-1.5 cursor-pointer">
                          <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${!selectedCategory ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                            {!selectedCategory && <div className="w-2 h-2 bg-white" />}
                          </div>
                          <input type="radio" name="mob-cat" checked={!selectedCategory} onChange={() => updateFilters('category', '')} className="hidden" />
                          <span className="text-sm" style={{ color: !selectedCategory ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>All</span>
                        </label>
                        {categories.map(c => (
                          <label key={c._id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                            <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedCategory === c.slug ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                              {selectedCategory === c.slug && <div className="w-2 h-2 bg-white" />}
                            </div>
                            <input type="radio" name="mob-cat" checked={selectedCategory === c.slug} onChange={() => updateFilters('category', c.slug)} className="hidden" />
                            <span className="text-sm" style={{ color: selectedCategory === c.slug ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="label-upper text-[0.625rem] mb-3" style={{ color: 'var(--color-text-secondary)' }}>Price</h4>
                      <PriceRangeSlider min={priceRange.min} max={priceRange.max} value={selectedPriceRange} onChange={handlePriceChange} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-4" style={{ backgroundColor: 'var(--color-background)', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    onClick={clearFilters}
                    className="flex-1 py-2.5 text-xs tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
                    style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                  >
                    Clear
                  </button>
                  <button onClick={() => setIsFilterOpen(false)} className="flex-1 btn-editorial text-xs py-2.5">
                    View Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="w-10 h-10 border-2 border-[color:var(--color-border-light)] border-t-[#2a1a0a] rounded-full animate-spin"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-6 lg:gap-8">
                {products.map((product, index) => (
                  <div key={product._id} className="product-card-item opacity-0">
                    <ProductCard product={product} priority={index < 4} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/60 border border-dashed border-[color:var(--color-border-light)]">
                <p className="text-[color:var(--color-body)] text-lg mb-4" style={{ fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)" }}>No products found matching your criteria.</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="px-6 py-2 text-[11px] uppercase tracking-[0.15em] border border-[color:var(--color-heading)] text-[color:var(--color-heading)] hover:bg-[color:var(--color-heading)] hover:text-[color:var(--color-subtle-bg)] transition-colors" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className="mt-12 text-center">
                <span className="text-[11px] text-[color:var(--color-body)] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>Showing all {products.length} products</span>
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
      <div className="min-h-screen bg-[color:var(--color-page-bg)] pt-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="w-48 h-8 bg-[#e8e0d0] animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="hidden lg:block h-96 bg-[color:var(--color-subtle-bg)] animate-pulse"></div>
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] bg-[color:var(--color-subtle-bg)] animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
