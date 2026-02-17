'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { productAPI, categoryAPI } from '@/utils/api';

/* ═══════════════════════════════════════════════════════════
   RADEO NAVBAR — Luxury Minimal Navigation
   ═══════════════════════════════════════════════════════════ */
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { settings } = useSiteSettings();
  const theme = settings?.theme || {};
  const stickyHeader = theme.stickyHeader !== false;
  const isTransparentHeader = theme.headerVariant === 'transparent';
  const logoWidth = settings?.branding?.logo?.width || 120;
  const logoHeight = settings?.branding?.logo?.height || 40;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(cartCount);
  const [prevWishlistCount, setPrevWishlistCount] = useState(wishlistCount);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartRef = useRef(null);
  const wishlistRef = useRef(null);
  const categoriesDropdownRef = useRef(null);
  const navRef = useRef(null);
  const searchRequestIdRef = useRef(0);

  // ── Fetch categories ──
  useEffect(() => {
    categoryAPI.getNavbarCategories()
      .then(r => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  // ── Scroll handling ──
  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // ── Close dropdowns on click outside ──
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setIsSearchOpen(false); setIsSearchBarVisible(false); }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Cart bounce animation ──
  useEffect(() => {
    if (cartCount > prevCartCount && cartRef.current) {
      anime({ targets: cartRef.current, scale: [1, 1.5, 1], rotate: [0, 10, -10, 0], duration: 400, easing: 'easeOutElastic(1, .5)' });
    }
    setPrevCartCount(cartCount);
  }, [cartCount, prevCartCount]);

  // ── Wishlist bounce animation ──
  useEffect(() => {
    if (wishlistCount > prevWishlistCount && wishlistRef.current) {
      anime({ targets: wishlistRef.current, scale: [1, 1.5, 1], duration: 400, easing: 'easeOutElastic(1, .5)' });
    }
    setPrevWishlistCount(wishlistCount);
  }, [wishlistCount, prevWishlistCount]);

  // ── Categories dropdown animation ──
  useEffect(() => {
    if (isCategoriesOpen && categoriesDropdownRef.current) {
      anime({ targets: categoriesDropdownRef.current, opacity: [0, 1], translateY: [8, 0], duration: 250, easing: 'easeOutCubic' });
    }
  }, [isCategoriesOpen]);

  // ── Navbar offset ──
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const shouldReserveSpace = stickyHeader && !isTransparentHeader;
    const applyOffset = () => {
      if (!shouldReserveSpace) { root.style.setProperty('--navbar-offset', '0px'); return; }
      root.style.setProperty('--navbar-offset', `${navRef.current?.offsetHeight || 72}px`);
    };
    applyOffset();
    if (typeof ResizeObserver !== 'undefined' && navRef.current) {
      const obs = new ResizeObserver(applyOffset);
      obs.observe(navRef.current);
      window.addEventListener('resize', applyOffset);
      return () => { obs.disconnect(); window.removeEventListener('resize', applyOffset); };
    }
    window.addEventListener('resize', applyOffset);
    return () => window.removeEventListener('resize', applyOffset);
  }, [stickyHeader, isTransparentHeader]);

  // ── Search products ──
  useEffect(() => {
    if (searchQuery.length < 2) { searchRequestIdRef.current++; setSearchResults([]); return; }
    const id = ++searchRequestIdRef.current;
    const t = setTimeout(async () => {
      try {
        const r = await productAPI.getAllProducts({ search: searchQuery, limit: 6 });
        if (id !== searchRequestIdRef.current) return;
        const d = Array.isArray(r.data) ? r.data : (r.data.products || []);
        setSearchResults(d);
      } catch { if (id === searchRequestIdRef.current) setSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false); setIsSearchBarVisible(false); setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  // ── Hide on admin routes ──
  if (pathname && pathname.startsWith('/admin')) return null;

  // ── Nav links ──
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
  ];

  const navLinksAfterCategories = [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <nav
      ref={navRef}
      className={`${stickyHeader ? 'fixed' : 'absolute'} top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isTransparentHeader
          ? isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
          : isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-[72px]">

          {/* ── Left: Nav Links (Desktop) ── */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? 'text-[#2a1a0a]'
                      : 'text-[#8a7460] hover:text-[#2a1a0a]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  {link.label}
                  {isActive && <span className="block w-full h-[1px] bg-[#c9a96e] mt-0.5" />}
                </Link>
              );
            })}

            {/* Categories dropdown — positioned between Shop and About */}
            <div
              className="relative"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button
                className="px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-[#8a7460] hover:text-[#2a1a0a] transition-colors flex items-center gap-1"
                style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
              >
                Categories
                <svg className={`w-3 h-3 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCategoriesOpen && (
                <div
                  ref={categoriesDropdownRef}
                  className="absolute top-full left-0 w-72 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden mt-1"
                >
                  <Link
                    href="/categories"
                    className="flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#c9a96e] hover:bg-[#faf8f4] border-b border-gray-100 transition-colors"
                    style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                    onClick={() => setIsCategoriesOpen(false)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]" />
                    All Categories
                  </Link>
                  <div className="max-h-80 overflow-y-auto">
                    {categories.map(cat => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat.slug}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-[#faf8f4] transition-colors group"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        {cat.image?.url ? (
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-50">
                            <Image src={cat.image.url} alt={cat.name} width={40} height={40} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#f2ede4] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#5c3d1e] font-bold text-sm" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>{cat.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#2a1a0a] group-hover:text-[#a07840] transition-colors">{cat.name}</div>
                          {cat.description && <div className="text-xs text-[#8a7460] truncate">{cat.description}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* About & Contact — after Categories */}
            {navLinksAfterCategories.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? 'text-[#2a1a0a]'
                      : 'text-[#8a7460] hover:text-[#2a1a0a]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  {link.label}
                  {isActive && <span className="block w-full h-[1px] bg-[#c9a96e] mt-0.5" />}
                </Link>
              );
            })}
          </div>

          {/* ── Center: Logo ── */}
          <Link href="/" className="flex items-center justify-center shrink-0">
            {settings?.branding?.logo?.url ? (
              <div className="relative" style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}>
                <Image src={settings.branding.logo.url} alt={settings.branding.logo.alt || 'Radeo'} fill className="object-contain object-center" priority />
              </div>
            ) : (
              <span
                className="text-2xl font-bold text-[#2a1a0a] hover:text-[#5c3d1e] transition-colors tracking-[0.15em]"
                style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}
              >
                RADEO
              </span>
            )}
          </Link>

          {/* ── Right: Icons ── */}
          <div className="flex items-center gap-1">

            {/* Search toggle (desktop) */}
            <button
              onClick={() => setIsSearchBarVisible(!isSearchBarVisible)}
              className="hidden lg:flex w-9 h-9 items-center justify-center text-[#8a7460] hover:text-[#2a1a0a] transition-colors rounded-full hover:bg-[#f2ede4]"
              aria-label="Search"
            >
              <FiSearch className="w-[18px] h-[18px]" />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative w-9 h-9 flex items-center justify-center text-[#8a7460] hover:text-[#2a1a0a] transition-colors rounded-full hover:bg-[#f2ede4]" aria-label="Wishlist">
              <div ref={wishlistRef}><FiHeart className="w-[18px] h-[18px]" /></div>
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 text-[10px] font-bold bg-[#2a1a0a] text-[#f2ede4] rounded-full flex items-center justify-center">{wishlistCount}</span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" id="cart-icon-container" className="relative w-9 h-9 flex items-center justify-center text-[#8a7460] hover:text-[#2a1a0a] transition-colors rounded-full hover:bg-[#f2ede4]" aria-label="Cart">
              <div ref={cartRef}><FiShoppingCart className="w-[18px] h-[18px]" /></div>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 text-[10px] font-bold bg-[#2a1a0a] text-[#f2ede4] rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-9 h-9 rounded-full bg-[#2a1a0a] text-[#f2ede4] flex items-center justify-center text-xs font-bold hover:bg-[#5c3d1e] transition-colors"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                  aria-label="User menu"
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-[#faf8f4]">
                      <p className="font-semibold text-[#2a1a0a] text-sm">{user?.name}</p>
                      <p className="text-xs text-[#8a7460] mt-0.5">{user?.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2a1a0a] hover:bg-[#faf8f4] transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <FiUser className="w-4 h-4 text-[#8a7460]" /> Profile
                    </Link>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2a1a0a] hover:bg-[#faf8f4] transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <FiPackage className="w-4 h-4 text-[#8a7460]" /> Orders
                    </Link>
                    {user?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c9a96e] bg-[#faf8f4] hover:bg-[#f2ede4] transition-colors font-medium" onClick={() => setIsUserMenuOpen(false)}>
                        <FiSettings className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                      <FiLogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:inline-flex px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] bg-[#2a1a0a] text-[#f2ede4] hover:bg-[#5c3d1e] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
              >
                Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[#2a1a0a] hover:text-[#8a7460] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Search bar (slides down on desktop) ── */}
      {isSearchBarVisible && (
        <div ref={searchRef} className="hidden lg:block border-t border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="max-w-[600px] mx-auto px-6 py-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for shoes..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                onFocus={() => setIsSearchOpen(true)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 border border-[#e8e0d0] rounded-none bg-transparent text-sm text-[#2a1a0a] placeholder-[#8a7460] focus:outline-none focus:border-[#c9a96e] transition-colors"
                style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7460] w-4 h-4" />
            </form>

            {/* Results dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-80 overflow-y-auto">
                {searchResults.map(product => (
                  <Link
                    key={product._id}
                    href={`/products/${product.slug}`}
                    onClick={() => { setIsSearchOpen(false); setIsSearchBarVisible(false); setSearchQuery(''); }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#faf8f4] transition-colors"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 bg-[#f2ede4] rounded">
                      <Image src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'} alt={product.name} fill sizes="56px" className="object-cover rounded" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[#2a1a0a] truncate">{product.name}</h4>
                      <p className="text-xs text-[#8a7460] uppercase tracking-wider">{product.category?.name}</p>
                      <p className="text-sm font-semibold text-[#a07840]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>₹{product.price?.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => { router.push(`/products?search=${encodeURIComponent(searchQuery)}`); setIsSearchOpen(false); setIsSearchBarVisible(false); setSearchQuery(''); }}
                  className="w-full px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.12em] text-[#c9a96e] hover:bg-[#faf8f4] transition-colors border-t border-gray-100"
                  style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
                >
                  View all results →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Menu ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className="px-6 py-4 space-y-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text" placeholder="Search for shoes..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e8e0d0] text-sm text-[#2a1a0a] placeholder-[#8a7460] focus:outline-none focus:border-[#c9a96e] bg-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7460] w-4 h-4" />
              </div>
            </form>

            {/* Mobile links */}
            <div className="space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    pathname === link.href ? 'text-[#2a1a0a] bg-[#faf8f4]' : 'text-[#8a7460]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile categories */}
              <div className="pt-3 border-t border-gray-100">
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#c9a96e]"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  All Categories
                </Link>
                {categories.map(cat => (
                  <Link
                    key={cat._id}
                    href={`/products?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#faf8f4] transition-colors"
                  >
                    {cat.image?.url ? (
                      <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-50">
                        <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded bg-[#f2ede4] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#5c3d1e] font-bold text-sm">{cat.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm text-[#2a1a0a]">{cat.name}</span>
                  </Link>
                ))}
              </div>

              {/* About & Contact — after Categories in mobile too */}
              {navLinksAfterCategories.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    pathname === link.href ? 'text-[#2a1a0a] bg-[#faf8f4]' : 'text-[#8a7460]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile login */}
              {!isAuthenticated && (
                <div className="pt-3 border-t border-gray-100">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] bg-[#2a1a0a] text-[#f2ede4]"
                    style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                  >
                    Login / Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
