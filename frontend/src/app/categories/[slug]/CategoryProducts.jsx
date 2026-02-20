'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { productAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import anime from 'animejs';

const ITEMS_PER_PAGE = 24;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
];

export default function CategoryProducts({ initialProducts = [], initialPagination = null, categorySlug, categoryName }) {
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef(null);
  const isInitialRender = useRef(true);

  const fetchProducts = useCallback(async (page = 1, sort = 'featured') => {
    setLoading(true);
    try {
      const params = {
        category: categorySlug,
        page,
        limit: ITEMS_PER_PAGE,
      };
      if (sort && sort !== 'featured') {
        params.sort = sort;
      }

      const response = await productAPI.getAllProducts(params);
      const data = response.data;

      if (data?.pagination) {
        setProducts(data.products || []);
        setPagination(data.pagination);
      } else {
        const list = Array.isArray(data) ? data : (data?.products || []);
        setProducts(list);
        setPagination(null);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  // Re-fetch when sort or page changes (skip initial render)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    fetchProducts(currentPage, sortBy);
  }, [sortBy, currentPage, fetchProducts]);

  // Animate product cards on mount
  useEffect(() => {
    if (gridRef.current && products.length > 0) {
      const cards = gridRef.current.querySelectorAll('[data-product-card]');
      if (cards.length > 0) {
        anime({
          targets: cards,
          opacity: [0, 1],
          translateY: [20, 0],
          delay: anime.stagger(50, { start: 100 }),
          duration: 500,
          easing: 'easeOutCubic',
        });
      }
    }
  }, [products]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = pagination?.totalPages || 1;
  const totalProducts = pagination?.total || products.length;

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: '1px solid #E5E2DC' }}>
        <p
          style={{
            fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
            fontSize: '12px',
            color: '#8A7E74',
            letterSpacing: '0.05em',
          }}
        >
          {loading ? 'Loading...' : `${totalProducts} product${totalProducts !== 1 ? 's' : ''}`}
        </p>
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="text-sm border-0 bg-transparent cursor-pointer focus:outline-none"
          style={{
            fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
            color: '#5A5047',
            fontSize: '13px',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {products.length === 0 && !loading ? (
        <div className="text-center py-20">
          <p
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
              fontSize: '1.3rem',
              color: '#8A7E74',
            }}
          >
            No products found in {categoryName}
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
              fontSize: '14px',
              color: '#A09890',
            }}
          >
            Check back soon for new arrivals
          </p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}
        >
          {products.map((product, idx) => (
            <div key={product._id || idx} data-product-card>
              <ProductCard product={product} priority={idx < 4} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ border: '1px solid #E5E2DC', background: '#fff' }}
          >
            <FiChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true;
              if (page === 1 || page === totalPages) return true;
              if (Math.abs(page - currentPage) <= 1) return true;
              return false;
            })
            .reduce((acc, page, i, arr) => {
              if (i > 0 && page - arr[i - 1] > 1) {
                acc.push('...');
              }
              acc.push(page);
              return acc;
            }, [])
            .map((item, i) =>
              item === '...' ? (
                <span key={`dots-${i}`} className="px-2 text-sm" style={{ color: '#A09890' }}>...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => handlePageChange(item)}
                  className="w-10 h-10 flex items-center justify-center text-sm transition-colors"
                  style={{
                    border: '1px solid #E5E2DC',
                    background: currentPage === item ? '#1A1714' : '#fff',
                    color: currentPage === item ? '#fff' : '#5A5047',
                    fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                    fontSize: '12px',
                  }}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ border: '1px solid #E5E2DC', background: '#fff' }}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
