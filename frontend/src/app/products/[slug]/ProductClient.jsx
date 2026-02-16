'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { getColorName } from '@/components/ColorPicker';
import { FiHeart, FiShoppingCart, FiAward, FiTruck, FiShield, FiCheck, FiChevronLeft, FiChevronRight, FiRotateCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ProductMetadata from '@/components/ProductMetadata';
import ReviewSection from '@/components/ReviewSection';
import Product360Viewer from '@/components/products/Product360Viewer';

export default function ProductClient({ product }) {
    const router = useRouter();

    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [selectedSize, setSelectedSize] = useState(() => {
        if (product?.sizes?.length > 0) {
            return typeof product.sizes[0] === 'object' ? product.sizes[0].size : product.sizes[0];
        }
        return '';
    });

    const [selectedColor, setSelectedColor] = useState(() => {
        if (product?.colors?.length > 0) {
            return product.colors[0];
        }
        return '';
    });

    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');

    // Filter images based on selected color
    const filteredImages = useMemo(() => {
        if (!product?.images) return [];

        if (!selectedColor) return product.images;

        const normalize = (c) => c?.toLowerCase().trim();
        const targetColor = normalize(selectedColor);

        // Images specifically for this color
        const colorSpecific = product.images.filter(img => normalize(img.color) === targetColor);

        // Images with no color (common/neutral)
        const neutral = product.images.filter(img => !img.color);

        // If we have specific images for this color, prioritize them
        if (colorSpecific.length > 0) {
            return [...colorSpecific, ...neutral];
        }

        // Fallback to all images if no specific ones found
        return product.images;
    }, [product, selectedColor]);

    // Reset selected image when color changes
    useEffect(() => {
        setSelectedImage(0);
    }, [selectedColor]);

    if (!product) {
        return null;
    }

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

        await addToCart(product._id, selectedSize, selectedColor || '');
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

        const result = await addToCart(product._id, selectedSize, selectedColor || '');
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

    const inWishlist = isInWishlist(product._id);

    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % filteredImages.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    };

    return (
        <>
            <ProductMetadata product={product} />
            <div className="min-h-screen bg-primary-50 pt-24">
                <div className="container-custom section-padding">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square bg-white rounded-lg overflow-hidden group">
                                <Image
                                    src={filteredImages[selectedImage]?.url || filteredImages[selectedImage] || '/placeholder.jpg'}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-contain transition-transform duration-500 hover:scale-110 cursor-zoom-in"
                                    priority
                                />

                                {/* Navigation Arrows */}
                                {filteredImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                            aria-label="Previous image"
                                        >
                                            <FiChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                            aria-label="Next image"
                                        >
                                            <FiChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                            </div>

                            {/* 360 View Toggle */}
                            {product.images360 && product.images360.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-primary-900 flex items-center gap-2">
                                            <FiRotateCw /> 360° View
                                        </h3>
                                        <span className="text-xs text-primary-500">Drag to rotate</span>
                                    </div>
                                    <Product360Viewer
                                        images={product.images360.map(img => img.url)}
                                        hotspots={product.hotspots360 || []}
                                        aspectRatio="aspect-square"
                                    />
                                </div>
                            )}

                            {/* Thumbnail Images */}
                            {filteredImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-4">
                                    {filteredImages.map((image, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-brand-brown' : 'border-transparent hover:border-primary-300'
                                                }`}
                                        >
                                            <Image
                                                src={image?.url || image || '/placeholder.jpg'}
                                                alt={`${product.name} ${idx + 1}`}
                                                fill
                                                sizes="(max-width: 1024px) 25vw, 12vw"
                                                className="object-contain"
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

                                {/* Price with Discount Display */}
                                {product.comparePrice && product.comparePrice > product.price ? (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-3xl font-bold text-green-600">
                                            ₹{product.price?.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xl text-gray-500 line-through">
                                            ₹{product.comparePrice?.toLocaleString('en-IN')}
                                        </p>
                                        <span className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                                            {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-3xl font-bold text-brand-brown">
                                        ₹{product.price?.toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-primary-700 leading-relaxed">
                                {product.description}
                            </p>

                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-primary-900 mb-3">
                                        Select Color: <span className="capitalize text-brand-brown">{getColorName(selectedColor)}</span>
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors.map((color, idx) => {
                                            // Parse color - handle hex codes or color names
                                            const colorValue = color.startsWith('#') ? color : color.toLowerCase();
                                            const colorName = getColorName(color);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`relative w-12 h-12 rounded-full border-3 transition-all ${selectedColor === color
                                                        ? 'border-brand-brown ring-2 ring-brand-brown ring-offset-2 scale-110'
                                                        : 'border-primary-300 hover:border-brand-brown hover:scale-105'
                                                        }`}
                                                    style={{ backgroundColor: colorValue }}
                                                    title={colorName}
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
                                                    className={`px-6 py-3 border-2 rounded-lg font-medium transition-all ${selectedSize === sizeValue
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
                                    className={`flex-1 text-lg py-4 ${product.inStock
                                        ? 'btn btn-primary'
                                        : 'bg-primary-200 text-primary-500 cursor-not-allowed hover:bg-primary-200'
                                        }`}
                                >
                                    {product.inStock ? 'Buy Now' : 'Out of Stock'}
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock}
                                    className={`flex-1 text-lg py-4 flex items-center justify-center gap-2 ${product.inStock
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
                                    className={`pb-4 font-medium transition-colors ${activeTab === 'description'
                                        ? 'border-b-2 border-brand-brown text-brand-brown'
                                        : 'text-primary-600 hover:text-primary-900'
                                        }`}
                                >
                                    Description
                                </button>
                                <button
                                    onClick={() => setActiveTab('specifications')}
                                    className={`pb-4 font-medium transition-colors ${activeTab === 'specifications'
                                        ? 'border-b-2 border-brand-brown text-brand-brown'
                                        : 'text-primary-600 hover:text-primary-900'
                                        }`}
                                >
                                    Specifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('care')}
                                    className={`pb-4 font-medium transition-colors ${activeTab === 'care'
                                        ? 'border-b-2 border-brand-brown text-brand-brown'
                                        : 'text-primary-600 hover:text-primary-900'
                                        }`}
                                >
                                    Care Instructions
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`pb-4 font-medium transition-colors ${activeTab === 'reviews'
                                        ? 'border-b-2 border-brand-brown text-brand-brown'
                                        : 'text-primary-600 hover:text-primary-900'
                                        }`}
                                >
                                    Reviews
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
                                        {product.specifications?.material && (
                                            <li><strong>Material:</strong> {product.specifications.material}</li>
                                        )}
                                        {product.specifications?.sole && (
                                            <li><strong>Sole:</strong> {product.specifications.sole}</li>
                                        )}
                                        {product.specifications?.construction && (
                                            <li><strong>Construction:</strong> {product.specifications.construction}</li>
                                        )}
                                        {product.specifications?.madeIn && (
                                            <li><strong>Made in:</strong> {product.specifications.madeIn}</li>
                                        )}
                                        {product.category?.name && (
                                            <li><strong>Category:</strong> {product.category.name}</li>
                                        )}
                                        {product.sizes && product.sizes.length > 0 && (
                                            <li>
                                                <strong>Available Sizes:</strong> UK{' '}
                                                {product.sizes.map(s => typeof s === 'object' ? s.size : s).join(', ')}
                                            </li>
                                        )}
                                        {product.brand && (
                                            <li><strong>Brand:</strong> {product.brand}</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'care' && (
                                <div>
                                    <h3 className="font-serif text-2xl font-bold mb-4">Care Instructions</h3>
                                    {product.careInstructions && product.careInstructions.length > 0 ? (
                                        <ul className="space-y-2 text-primary-700">
                                            {product.careInstructions.map((instruction, index) => (
                                                <li key={index} className="flex gap-3">
                                                    <span className="text-brand-brown font-semibold">•</span>
                                                    <span>{instruction}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-primary-600">No care instructions available for this product.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    <ReviewSection productId={product._id} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}
