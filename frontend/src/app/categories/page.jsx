'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { categoryAPI, productAPI } from '@/utils/api';
import { FiGrid } from 'react-icons/fi';

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
      <div className="min-h-screen bg-primary-50 pt-6">
        <div className="container-custom section-padding">
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-2 border-[color:var(--color-border-light)] border-t-[#2a1a0a] rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-page-bg)] pt-6">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[11px] text-[color:var(--color-accent)] mb-3 uppercase tracking-[0.3em] font-medium" style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>Browse</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-[color:var(--color-heading)] mb-4" style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}>
            Our Categories
          </h1>
          <p className="text-lg text-[color:var(--color-body)] max-w-2xl mx-auto" style={{ fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)" }}>
            Explore our complete collection of handcrafted shoes organized by category
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => router.push(`/category/${category.slug}`)}
              className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[color:var(--color-border-light)] hover:border-[color:var(--color-accent)]"
            >
              {/* Category Image */}
              <div className="relative aspect-[4/3] bg-[color:var(--color-subtle-bg)] overflow-hidden">
                {category.image?.url ? (
                  <Image
                    src={category.image.url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-3xl font-bold text-[color:var(--color-accent)]" style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}>{category.name.charAt(0)}</span>
                    </div>
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Category Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[color:var(--color-heading)] mb-2 group-hover:text-[color:var(--color-accent-hover)] transition-colors" style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}>
                  {category.name}
                </h3>
                {category.description && (
                    <p className="text-sm text-[color:var(--color-body)] mb-3 line-clamp-2" style={{ fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)" }}>
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-[color:var(--color-border-light)]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)]"></div>
                    <p className="text-[11px] font-medium text-[color:var(--color-body)] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                      {categoryStats[category._id] || 0} Products
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-[color:var(--color-subtle-bg)] group-hover:bg-[color:var(--color-heading)] flex items-center justify-center transition-colors">
                    <span className="text-[color:var(--color-heading)] group-hover:text-[color:var(--color-subtle-bg)] group-hover:translate-x-0.5 transition-all text-lg">
                      â†’
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <FiGrid className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-primary-600 text-lg">No categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
