'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Note: Dynamic metadata generation requires server component
// For client components with dynamic data, we update meta tags via useEffect
// Consider moving to server component for better SEO
import { useParams, useRouter } from 'next/navigation';
import { productAPI } from '@/utils/api';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { FiHeart, FiShoppingCart, FiAward, FiTruck, FiShield, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;
  
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProductBySlug(slug);
      // Backend returns product directly, not wrapped in {product: {...}}
      console.log('📦 Product detail API response:', response.data);
      const productData = response.data.product || response.data;
      setProduct(productData);
      if (productData.sizes && productData.sizes.length > 0) {
        // Handle both string sizes and object sizes {size, stock}
        const firstSize = typeof productData.sizes[0] === 'object' ? productData.sizes[0].size : productData.sizes[0];
        setSelectedSize(firstSize);
      }
      if (productData.colors && productData.colors.length > 0) {
        setSelectedColor(productData.colors[0]);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    await addToCart(product._id, selectedSize);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      router.push('/auth/login');
      return;
    }

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const result = await addToCart(product._id, selectedSize);
    if (result.success) {
      router.push('/cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      router.push('/auth/login');
      return;
    }

    await toggleWishlist(product._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 flex justify-center items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const inWishlist = isInWishlist(product._id);

  return (
    <div className="min-h-screen bg-primary-50 pt-24">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              <Image
                src={product.images[selectedImage]?.url || product.images[selectedImage] || '/placeholder.jpg'}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-brand-brown' : 'border-transparent hover:border-primary-300'
                    }`}
                  >
                    <Image
                      src={image?.url || image || '/placeholder.jpg'}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      sizes="(max-width: 1024px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Name */}
            <div>
              <p className="text-sm uppercase tracking-wider text-primary-600 mb-2">
                {product.category?.name}
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-4">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-brand-brown">
                ₹{product.price?.toLocaleString()}
              </p>
            </div>

            {/* Description */}
            <p className="text-primary-700 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-3">
                  Select Color: <span className="capitalize text-brand-brown">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, idx) => {
                    // Parse color - handle hex codes or color names
                    const colorValue = color.startsWith('#') ? color : color.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-12 h-12 rounded-full border-3 transition-all ${
                          selectedColor === color
                            ? 'border-brand-brown ring-2 ring-brand-brown ring-offset-2 scale-110'
                            : 'border-primary-300 hover:border-brand-brown hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorValue }}
                        title={color}
                      >
                        {selectedColor === color && (
                          <FiCheck className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-lg" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-primary-900 mb-3">
                  Select Size (UK)
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((sizeItem, idx) => {
                    const sizeValue = typeof sizeItem === 'object' ? sizeItem.size : sizeItem;
                    const stock = typeof sizeItem === 'object' ? sizeItem.stock : null;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(sizeValue)}
                        disabled={stock !== null && stock === 0}
                        className={`px-6 py-3 border-2 rounded-lg font-medium transition-all ${
                          selectedSize === sizeValue
                            ? 'border-brand-brown bg-brand-brown text-white'
                            : stock === 0
                            ? 'border-primary-200 bg-primary-100 text-primary-400 cursor-not-allowed'
                            : 'border-primary-200 hover:border-brand-brown'
                        }`}
                      >
                        {sizeValue}
                        {stock !== null && stock === 0 && ' (Out of Stock)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className={`flex items-center gap-2 text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
              {product.inStock ? (
                <>
                  <FiCheck className="w-5 h-5" />
                  <span className="font-medium">In Stock - Made to Order</span>
                </>
              ) : (
                <span className="font-medium">Currently Unavailable</span>
              )}
            </div>

            {/* Action Buttons - Always Show */}
            <div className="flex gap-4">
              <button 
                onClick={handleBuyNow} 
                disabled={!product.inStock}
                className={`flex-1 text-lg py-4 ${
                  product.inStock 
                    ? 'btn btn-primary' 
                    : 'bg-primary-200 text-primary-500 cursor-not-allowed hover:bg-primary-200'
                }`}
              >
                {product.inStock ? 'Buy Now' : 'Out of Stock'}
              </button>
              <button 
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`flex-1 text-lg py-4 flex items-center justify-center gap-2 ${
                  product.inStock 
                    ? 'btn btn-secondary' 
                    : 'bg-primary-200 text-primary-500 cursor-not-allowed hover:bg-primary-200'
                }`}
              >
                <FiShoppingCart />
                {product.inStock ? 'Add to Cart' : 'Unavailable'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`btn ${inWishlist ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-ghost'} px-6 py-4`}
              >
                <FiHeart className={`w-6 h-6 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-primary-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiAward className="w-5 h-5 text-brand-brown" />
                </div>
                <div>
                  <p className="font-medium text-sm">Handcrafted</p>
                  <p className="text-xs text-primary-600">Premium Quality</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiTruck className="w-5 h-5 text-brand-brown" />
                </div>
                <div>
                  <p className="font-medium text-sm">Free Delivery</p>
                  <p className="text-xs text-primary-600">7-10 Business Days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-brand-brown" />
                </div>
                <div>
                  <p className="font-medium text-sm">Premium Leather</p>
                  <p className="text-xs text-primary-600">Finest Materials</p>
                </div>
              </div>
            </div>

            {/* Made to Order Notice */}
            <div className="bg-brand-cream/30 rounded-lg p-4 border border-brand-tan/20">
              <p className="text-sm text-primary-800">
                <strong>Made to Order:</strong> This product is custom-crafted upon order. 
                Please allow 7-10 business days for production and delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-primary-200 mb-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === 'description'
                    ? 'border-b-2 border-brand-brown text-brand-brown'
                    : 'text-primary-600 hover:text-primary-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === 'specifications'
                    ? 'border-b-2 border-brand-brown text-brand-brown'
                    : 'text-primary-600 hover:text-primary-900'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === 'care'
                    ? 'border-b-2 border-brand-brown text-brand-brown'
                    : 'text-primary-600 hover:text-primary-900'
                }`}
              >
                Care Instructions
              </button>
            </div>
          </div>

          <div className="prose max-w-none">
            {activeTab === 'description' && (
              <div>
                <h3 className="font-serif text-2xl font-bold mb-4">Product Description</h3>
                <p className="text-primary-700 leading-relaxed">
                  {product.description || 'Crafted with precision and attention to detail, this shoe embodies timeless elegance and superior craftsmanship.'}
                </p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="font-serif text-2xl font-bold mb-4">Specifications</h3>
                <ul className="space-y-2 text-primary-700">
                  <li><strong>Material:</strong> Premium Leather</li>
                  <li><strong>Sole:</strong> Leather Sole</li>
                  <li><strong>Construction:</strong> Goodyear Welted</li>
                  <li><strong>Made in:</strong> India</li>
                  <li><strong>Category:</strong> {product.category?.name}</li>
                  {product.sizes && <li><strong>Available Sizes:</strong> UK {product.sizes.join(', ')}</li>}
                </ul>
              </div>
            )}

            {activeTab === 'care' && (
              <div>
                <h3 className="font-serif text-2xl font-bold mb-4">Care Instructions</h3>
                <ul className="space-y-2 text-primary-700">
                  <li>• Use a soft brush to remove dirt and dust</li>
                  <li>• Apply leather conditioner regularly to maintain suppleness</li>
                  <li>• Store in a cool, dry place away from direct sunlight</li>
                  <li>• Use shoe trees to maintain shape</li>
                  <li>• Avoid exposure to water; if wet, let dry naturally</li>
                  <li>• Professional cleaning recommended for stubborn stains</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
