'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productAPI } from '@/utils/api';
import ProductCard from '@/components/ProductCard';
import { FiArrowRight, FiAward, FiTruck, FiShield } from 'react-icons/fi';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAllProducts({ limit: 8 });
      setFeaturedProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-brand-cream/20 to-primary-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary-900 mb-4 sm:mb-6 animate-fade-in leading-tight">
              Step Into
              <span className="block text-brand-brown mt-2">Timeless Elegance</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-700 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in px-4">
              Discover exquisite handcrafted shoes made with premium materials and timeless craftsmanship. 
              Each pair is a masterpiece designed to elevate your style.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in px-4">
              <Link href="/products" className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                Explore Collection
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/about" className="btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                Our Story
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-brown/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-tan/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAward className="w-8 h-8 text-brand-brown" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Handcrafted Quality</h3>
              <p className="text-primary-600">
                Each pair is meticulously crafted by skilled artisans using traditional techniques
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTruck className="w-8 h-8 text-brand-brown" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Free Delivery</h3>
              <p className="text-primary-600">
                Complimentary shipping on all orders within India
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="w-8 h-8 text-brand-brown" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Premium Materials</h3>
              <p className="text-primary-600">
                Only the finest leather and materials for lasting comfort and style
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-primary-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-4">
              Featured Collection
            </h2>
            <p className="text-lg text-primary-600 max-w-2xl mx-auto">
              Explore our handpicked selection of premium shoes crafted for the discerning gentleman
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="spinner"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/products" className="btn btn-primary">
                  View All Products
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-primary-600 text-lg">No products available at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Made to Order Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-6">
              Made to Order
            </h2>
            <p className="text-lg text-primary-600 mb-8">
              All our shoes are crafted to order, ensuring perfect fit and uncompromising quality. 
              Each pair takes 7-10 business days to create, a testament to our commitment to excellence.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-brown rounded-full"></div>
                <span>Custom Crafted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-brown rounded-full"></div>
                <span>Premium Leather</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-brown rounded-full"></div>
                <span>Expert Artisans</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-brown rounded-full"></div>
                <span>7-10 Days Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding gradient-primary text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-4">
              Join Our Community
            </h2>
            <p className="text-lg mb-8 text-white/90">
              Be the first to know about new collections, exclusive offers, and styling tips
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-lg text-primary-900 focus:outline-none focus:ring-2 focus:ring-brand-tan"
              />
              <button type="submit" className="btn bg-white text-brand-brown hover:bg-brand-cream px-8">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
