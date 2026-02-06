'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { productAPI, categoryAPI } from '@/utils/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getNavbarCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await productAPI.getAllProducts({ search: searchQuery, limit: 6 });
        // Backend returns array directly, not wrapped in {products: [...]}
        const productsData = Array.isArray(response.data) ? response.data : (response.data.products || []);
        setSearchResults(productsData);
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-serif font-bold text-primary-900 hover:text-brand-brown transition-colors">
            Radeo
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={`hover:text-brand-brown transition-colors ${pathname === '/' ? 'text-brand-brown font-semibold' : ''}`}>
              Home
            </Link>
            <Link href="/products" className={`hover:text-brand-brown transition-colors ${pathname === '/products' ? 'text-brand-brown font-semibold' : ''}`}>
              Products
            </Link>
            
            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="hover:text-brand-brown transition-colors flex items-center gap-1">
                Categories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 animate-slide-down border border-gray-100">
                <Link
                  href="/categories"
                  className="block px-4 py-3 font-semibold text-brand-brown hover:bg-primary-50 first:rounded-t-lg border-b border-primary-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    All Categories
                  </div>
                </Link>
                <div className="max-h-96 overflow-y-auto">
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/products?category=${category.slug}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors group/item"
                    >
                      {category.image?.url ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={category.image.url}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-lg">{category.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover/item:text-brand-brown transition-colors">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-gray-500 truncate">{category.description}</div>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="hidden lg:block relative flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for shoes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-900 transition-all"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              </div>
            </form>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto animate-slide-down">
                {searchResults.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-4 p-3 hover:bg-primary-50 transition-colors"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-primary-900">{product.name}</h4>
                      <p className="text-sm text-primary-600">{product.category?.name}</p>
                      <p className="text-sm font-semibold text-brand-brown">₹{product.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
                {searchQuery && (
                  <button
                    onClick={() => {
                      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-3 text-center text-brand-brown hover:bg-primary-50 font-medium border-t border-primary-100"
                  >
                    View all results
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {/* Wishlist */}
            <Link href="/wishlist" className="relative hover:text-brand-brown transition-colors">
              <FiHeart className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-brown text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative hover:text-brand-brown transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-brown text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 rounded-full bg-primary-900 text-white flex items-center justify-center hover:bg-brand-brown transition-colors"
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl animate-slide-down">
                    <div className="p-3 border-b border-primary-100">
                      <p className="font-medium text-primary-900">{user?.name}</p>
                      <p className="text-sm text-primary-600">{user?.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-primary-50 transition-colors">
                      <FiUser className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-primary-50 transition-colors">
                      <FiPackage className="w-4 h-4" />
                      Orders
                    </Link>
                    {user?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-primary-50 bg-yellow-50 text-yellow-900 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-primary-50 text-red-600 transition-colors rounded-b-lg"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn btn-primary">
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-primary-900 hover:text-brand-brown transition-colors"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-slide-down">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for shoes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-900"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-2 hover:bg-primary-50 rounded transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link
                href="/categories"
                className="px-4 py-2 hover:bg-primary-50 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                All Categories
              </Link>
              <Link href="/products" className="px-4 py-2 hover:bg-primary-50 rounded transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Products
              </Link>
              <div className="px-4 py-2">
                <p className="text-sm font-semibold text-primary-600 mb-3">Categories</p>
                <div className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/products?category=${category.slug}`}
                      className="flex items-center gap-3 py-2 hover:bg-primary-50 rounded transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {category.image?.url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={category.image.url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-semibold">{category.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-gray-900">{category.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
