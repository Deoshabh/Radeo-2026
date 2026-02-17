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
            <div className="min-h-screen bg-[#faf8f4] pt-6">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square bg-white overflow-hidden group border border-[#e8e0d0]">
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
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-[#2a1a0a] p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border border-[#e8e0d0]"
                                            aria-label="Previous image"
                                        >
                                            <FiChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white text-[#2a1a0a] p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border border-[#e8e0d0]"
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
                                        <h3 className="text-[11px] font-semibold text-[#2a1a0a] flex items-center gap-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                            <FiRotateCw className="w-3.5 h-3.5" /> 360° View
                                        </h3>
                                        <span className="text-[10px] text-[#8a7460] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>Drag to rotate</span>
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
                                            className={`relative aspect-square bg-white overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-[#c9a96e]' : 'border-transparent hover:border-[#e8e0d0]'
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
                                <p className="text-[11px] uppercase tracking-[0.2em] text-[#c9a96e] mb-3 font-medium" style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                                    {product.category?.name}
                                </p>
                                <h1 className="text-3xl lg:text-4xl font-bold text-[#2a1a0a] mb-4" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                                    {product.name}
                                </h1>

                                {/* Price with Discount Display */}
                                {product.comparePrice && product.comparePrice > product.price ? (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-2xl font-bold text-[#2a1a0a]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                            ₹{product.price?.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-lg text-[#8a7460] line-through" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                            ₹{product.comparePrice?.toLocaleString('en-IN')}
                                        </p>
                                        <span className="bg-[#2a1a0a] text-[#f2ede4] text-[10px] font-bold px-3 py-1 uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                            {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-[#2a1a0a]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                        ₹{product.price?.toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-[#5c3d1e] leading-relaxed text-lg" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
                                {product.description}
                            </p>

                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <label className="block text-[11px] font-medium text-[#2a1a0a] mb-3 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                        Color: <span className="text-[#c9a96e] capitalize normal-case tracking-normal">{getColorName(selectedColor)}</span>
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
                                    <label className="block text-[11px] font-medium text-[#2a1a0a] mb-3 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                        Size (UK)
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
                                                    className={`px-5 py-2.5 border font-medium transition-all text-sm ${selectedSize === sizeValue
                                                        ? 'border-[#2a1a0a] bg-[#2a1a0a] text-[#f2ede4]'
                                                        : stock === 0
                                                            ? 'border-[#e8e0d0] bg-[#f2ede4] text-[#c4b8a4] cursor-not-allowed'
                                                            : 'border-[#e8e0d0] hover:border-[#2a1a0a] text-[#2a1a0a]'
                                                        }`}
                                                    style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
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
                            <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] ${product.inStock ? 'text-[#2a6a2a]' : 'text-[#8a2a2a]'}`} style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
                                {product.inStock ? (
                                    <>
                                        <FiCheck className="w-4 h-4" />
                                        <span className="font-medium">In Stock — Made to Order</span>
                                    </>
                                ) : (
                                    <span className="font-medium">Currently Unavailable</span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBuyNow}
                                    disabled={!product.inStock}
                                    className={`flex-1 py-4 text-[12px] uppercase tracking-[0.2em] font-medium transition-all ${product.inStock
                                        ? 'bg-[#2a1a0a] text-[#f2ede4] hover:bg-[#5c3d1e]'
                                        : 'bg-[#e8e0d0] text-[#8a7460] cursor-not-allowed'
                                        }`}
                                    style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
                                >
                                    {product.inStock ? 'Buy Now' : 'Out of Stock'}
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock}
                                    className={`flex-1 py-4 text-[12px] uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2 transition-all ${product.inStock
                                        ? 'border border-[#2a1a0a] text-[#2a1a0a] hover:bg-[#2a1a0a] hover:text-[#f2ede4]'
                                        : 'border border-[#e8e0d0] text-[#8a7460] cursor-not-allowed'
                                        }`}
                                    style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
                                >
                                    <FiShoppingCart className="w-4 h-4" />
                                    {product.inStock ? 'Add to Cart' : 'Unavailable'}
                                </button>
                                <button
                                    onClick={handleToggleWishlist}
                                    className={`px-5 py-4 border transition-all ${inWishlist ? 'bg-[#2a1a0a] text-[#f2ede4] border-[#2a1a0a]' : 'border-[#e8e0d0] text-[#8a7460] hover:border-[#2a1a0a] hover:text-[#2a1a0a]'}`}
                                >
                                    <FiHeart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#e8e0d0]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#f2ede4] flex items-center justify-center">
                                        <FiAward className="w-5 h-5 text-[#c9a96e]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-[#2a1a0a]">Handcrafted</p>
                                        <p className="text-[10px] text-[#8a7460] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>Premium Quality</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#f2ede4] flex items-center justify-center">
                                        <FiTruck className="w-5 h-5 text-[#c9a96e]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-[#2a1a0a]">Free Delivery</p>
                                        <p className="text-[10px] text-[#8a7460] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>7-10 Business Days</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#f2ede4] flex items-center justify-center">
                                        <FiShield className="w-5 h-5 text-[#c9a96e]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-[#2a1a0a]">Premium Leather</p>
                                        <p className="text-[10px] text-[#8a7460] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>Finest Materials</p>
                                    </div>
                                </div>
                            </div>

                            {/* Made to Order Notice */}
                            <div className="bg-[#f2ede4] p-4 border border-[#e8e0d0]">
                                <p className="text-sm text-[#5c3d1e]" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
                                    <strong>Made to Order:</strong> This product is custom-crafted upon order.
                                    Please allow 7-10 business days for production and delivery.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Tabs */}
                    <div className="mt-16">
                        <div className="border-b border-[#e8e0d0] mb-8">
                            <div className="flex gap-8">
                                {['description', 'specifications', 'care', 'reviews'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-[11px] uppercase tracking-[0.2em] font-medium transition-colors ${activeTab === tab
                                            ? 'border-b-2 border-[#2a1a0a] text-[#2a1a0a]'
                                            : 'text-[#8a7460] hover:text-[#2a1a0a]'
                                            }`}
                                        style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
                                    >
                                        {tab === 'care' ? 'Care' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="prose max-w-none">
                            {activeTab === 'description' && (
                                <div>
                                    <h3 className="text-2xl font-bold mb-4 text-[#2a1a0a]" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>Product Description</h3>
                                    <p className="text-[#5c3d1e] leading-relaxed text-lg" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
                                        {product.description || 'Crafted with precision and attention to detail, this shoe embodies timeless elegance and superior craftsmanship.'}
                                    </p>
                                </div>
                            )}

                            {activeTab === 'specifications' && (
                                <div>
                                    <h3 className="text-2xl font-bold mb-4 text-[#2a1a0a]" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>Specifications</h3>
                                    <ul className="space-y-2 text-[#5c3d1e]" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
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
                                    <h3 className="text-2xl font-bold mb-4 text-[#2a1a0a]" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>Care Instructions</h3>
                                    {product.careInstructions && product.careInstructions.length > 0 ? (
                                        <ul className="space-y-2 text-[#5c3d1e]" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>
                                            {product.careInstructions.map((instruction, index) => (
                                                <li key={index} className="flex gap-3">
                                                    <span className="text-[#c9a96e] font-semibold">&bull;</span>
                                                    <span>{instruction}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[#8a7460]" style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}>No care instructions available for this product.</p>
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
            </div>
        </>
    );
}
