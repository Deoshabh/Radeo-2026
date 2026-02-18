'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { categoryAPI, productAPI } from '@/utils/api';

export default function AllCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoriesResponse = await categoryAPI.getAllCategories();
      const cats = categoriesResponse.data.categories || [];
      setCategories(cats);

      // Fetch product count for each category
      const stats = {};
      await Promise.all(
        cats.map(async (category) => {
          try {
            const productsResponse = await productAPI.getAllProducts({ category: category.slug });
            const products = Array.isArray(productsResponse.data)
              ? productsResponse.data
              : productsResponse.data.products || [];
            stats[category._id] = products.length;
          } catch (error) {
            console.error(`Failed to fetch products for ${category.name}:`, error);
            stats[category._id] = 0;
          }
        })
      );
      setCategoryStats(stats);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#F7F5F1' }}>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E2DC', borderTopColor: '#1A1714' }} />
          </div>
        </div>
      </div>
    );
  }

  const isFeatured = categories.length === 1;

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F1' }}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">

        {/* Header */}
        <div className="mb-16">
          <p
            className="mb-3 uppercase"
            style={{
              fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
              fontSize: '10px',
              letterSpacing: '0.35em',
              color: '#B8973A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
            }}
          >
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#B8973A' }} />
            Browse
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
              fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#1A1714',
              marginBottom: '12px',
            }}
          >
            Our Categories
          </h1>
          <p
            style={{
              fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
              fontSize: '1.1rem',
              lineHeight: 1.7,
              color: '#5A5047',
              maxWidth: '480px',
            }}
          >
            Explore our complete collection of handcrafted shoes organized by category
          </p>
          <div className="mt-10" style={{ width: '40px', height: '1px', background: '#B8973A' }} />
        </div>

        {/* Categories Grid */}
        <div
          className="grid gap-6 lg:gap-8"
          style={{
            gridTemplateColumns: isFeatured
              ? '1fr'
              : categories.length <= 3
                ? 'repeat(auto-fit, minmax(320px, 1fr))'
                : 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {categories.map((category, index) => {
            const isFirstFeatured = index === 0 && categories.length <= 3;
            return (
              <button
                key={category._id}
                onClick={() => router.push(`/category/${category.slug}`)}
                className="group text-left overflow-hidden transition-shadow duration-300"
                style={{
                  background: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  ...(isFirstFeatured && !isFeatured ? { gridColumn: 'span 2' } : {}),
                  ...(isFeatured ? { maxWidth: '800px' } : {}),
                }}
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: isFirstFeatured ? '16/7' : '4/3',
                    background: '#F0EBE1',
                  }}
                >
                  {category.image?.url ? (
                    <Image
                      src={category.image.url}
                      alt={category.name}
                      fill
                      sizes={isFirstFeatured ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span
                        style={{
                          fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
                          fontSize: '3rem',
                          fontWeight: 300,
                          color: '#B8973A',
                          opacity: 0.5,
                        }}
                      >
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{ background: 'linear-gradient(to top, rgba(26,23,20,0.25) 0%, transparent 60%)' }}
                  />
                </div>

                <div className="p-6">
                  <h3
                    style={{
                      fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
                      fontSize: isFirstFeatured ? '1.4rem' : '1.15rem',
                      fontWeight: 500,
                      color: '#1A1714',
                      marginBottom: '6px',
                    }}
                  >
                    {category.name}
                  </h3>
                  {category.description && (
                    <p
                      className="line-clamp-2"
                      style={{
                        fontFamily: "var(--font-inter, 'DM Sans', sans-serif)",
                        fontSize: '13px',
                        color: '#6B6560',
                        lineHeight: 1.6,
                        marginBottom: '12px',
                      }}
                    >
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E5E2DC' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B8973A' }} />
                      <p
                        style={{
                          fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)",
                          fontSize: '11px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#6B6560',
                        }}
                      >
                        {categoryStats[category._id] || 0} Products
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 flex items-center justify-center transition-colors duration-200"
                      style={{ background: '#F0EBE1' }}
                    >
                      <span
                        className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{ color: '#1A1714', fontSize: '16px' }}
                      >
                        {'\u2192'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {categories.length > 0 && categories.length < 4 && (
          <div className="mt-16 text-center">
            <p style={{
              fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)",
              fontSize: '1rem',
              fontStyle: 'italic',
              color: '#A09890',
            }}>
              More categories coming soon
            </p>
          </div>
        )}

        {categories.length === 0 && (
          <div className="text-center py-20">
            <p style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', serif)",
              fontSize: '1.3rem',
              color: '#8A7E74',
            }}>
              No categories available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}