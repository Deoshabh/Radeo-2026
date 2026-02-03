'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { categoryAPI, productAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import { FiArrowLeft } from 'react-icons/fi';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch category details
      const categoryResponse = await categoryAPI.getCategoryBySlug(slug);
      const categoryData = categoryResponse.data.category || categoryResponse.data;
      setCategory(categoryData);

      // Fetch products in this category
      const productsResponse = await productAPI.getAllProducts({ category: slug });
      const productsData = Array.isArray(productsResponse.data)
        ? productsResponse.data
        : productsResponse.data.products || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
      router.push('/categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24">
        <div className="container-custom section-padding">
          <div className="flex justify-center items-center py-20">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-24">
      <div className="container-custom section-padding">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary-600 hover:text-brand-brown transition-colors mb-6"
        >
          <FiArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Category Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-primary-600 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
          <p className="text-primary-500 mt-4">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-primary-600 text-lg mb-4">
              No products available in this category yet.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="btn btn-primary"
            >
              Browse All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
