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
import { formatPrice } from '@/utils/helpers';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RADEO NAVBAR â€” Luxury Minimal Navigation
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

  // â”€â”€ Fetch categories â”€â”€
  useEffect(() => {
    categoryAPI.getNavbarCategories()
      .then(r => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  // â”€â”€ Scroll handling â”€â”€
  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // â”€â”€ Close dropdowns on click outside â”€â”€
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setIsSearchOpen(false); setIsSearchBarVisible(false); }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // â”€â”€ Cart bounce animation â”€â”€
  useEffect(() => {
    if (cartCount > prevCartCount && cartRef.current) {
      anime({ targets: cartRef.current, scale: [1, 1.5, 1], rotate: [0, 10, -10, 0], duration: 400, easing: 'easeOutElastic(1, .5)' });
    }
    setPrevCartCount(cartCount);
  }, [cartCount, prevCartCount]);

  // â”€â”€ Wishlist bounce animation â”€â”€
  useEffect(() => {
    if (wishlistCount > prevWishlistCount && wishlistRef.current) {
      anime({ targets: wishlistRef.current, scale: [1, 1.5, 1], duration: 400, easing: 'easeOutElastic(1, .5)' });
    }
    setPrevWishlistCount(wishlistCount);
  }, [wishlistCount, prevWishlistCount]);

  // â”€â”€ Categories dropdown animation â”€â”€
  useEffect(() => {
    if (isCategoriesOpen && categoriesDropdownRef.current) {
      anime({ targets: categoriesDropdownRef.current, opacity: [0, 1], translateY: [8, 0], duration: 250, easing: 'easeOutCubic' });
    }
  }, [isCategoriesOpen]);

  // â”€â”€ Navbar offset â”€â”€
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

  // â”€â”€ Search products â”€â”€
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

  // â”€â”€ Hide on admin routes â”€â”€
  if (pathname && pathname.startsWith('/admin')) return null;

  // â”€â”€ Nav links â”€â”€
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
  ];

  const navLinksAfterCategories = [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• RENDER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <nav
      ref={navRef}
      className={`${stickyHeader ? 'fixed' : 'absolute'} top-0 left-0 right-0 z-40 transition-all duration-500 ${
        isTransparentHeader
          ? isScrolled ? 'backdrop-blur-md shadow-sm' : 'bg-transparent'
          : isScrolled ? 'backdrop-blur-md shadow-sm' : 'backdrop-blur-sm'
      }`}
      style={
        isTransparentHeader && !isScrolled ? {} : {
          backgroundColor: isScrolled
            ? 'color-mix(in srgb, var(--color-navbar-bg, #ffffff) 95%, transparent)'
            : 'color-mix(in srgb, var(--color-navbar-bg, #ffffff) 80%, transparent)',
          color: 'var(--color-navbar-text, #1c1917)',
        }
      }
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-[72px]">

          {/* â”€â”€ Left: Nav Links (Desktop) â”€â”€ */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? 'text-[color:var(--color-heading)]'
                      : 'text-[color:var(--color-body)] hover:text-[color:var(--color-heading)]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
                >
                  {link.label}
                  {isActive && <span className="block w-full h-[1px] bg-[color:var(--color-accent)] mt-0.5" />}
                </Link>
              );
            })}

            {/* Categories dropdown â€” positioned between Shop and About */}
            <div
              className="relative"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <Link
                href="/categories"
                className="px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] text-[color:var(--color-body)] hover:text-[color:var(--color-heading)] transition-colors flex items-center gap-1 cursor-pointer"
                style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
              >
                Categories
                <svg className={`w-3 h-3 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {isCategoriesOpen && (
                <div
                  ref={categoriesDropdownRef}
                  className="absolute top-full left-0 w-72 pt-2 z-[45]"
                >
                  <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                  <Link
                    href="/categories"
                    className="flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-accent)] hover:bg-[color:var(--color-page-bg)] border-b border-gray-100 transition-colors"
                    style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
                    onClick={() => setIsCategoriesOpen(false)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)]" />
                    All Categories
                  </Link>
                  <div className="max-h-80 overflow-y-auto">
                    {categories.map(cat => (
                      <Link
                        key={cat._id}
                        href={`/products?category=${cat.slug}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-[color:var(--color-page-bg)] transition-colors group"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        {cat.image?.url ? (
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-50">
                            <Image src={cat.image.url} alt={cat.name} width={40} height={40} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-[color:var(--color-subtle-bg)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[color:var(--color-muted)] font-bold text-sm" style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}>{cat.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[color:var(--color-heading)] group-hover:text-[color:var(--color-accent-hover)] transition-colors">{cat.name}</div>
                          {cat.description && <div className="text-xs text-[color:var(--color-body)] truncate">{cat.description}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                  </div>
                </div>
              )}
            </div>

            {/* About & Contact â€” after Categories */}
            {navLinksAfterCategories.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? 'text-[color:var(--color-heading)]'
                      : 'text-[color:var(--color-body)] hover:text-[color:var(--color-heading)]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
                >
                  {link.label}
                  {isActive && <span className="block w-full h-[1px] bg-[color:var(--color-accent)] mt-0.5" />}
                </Link>
              );
            })}
          </div>

          {/* â”€â”€ Center: Logo â”€â”€ */}
          <Link href="/" className="flex items-center justify-center shrink-0">
            {settings?.branding?.logo?.url ? (
              <div className="relative" style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}>
                <Image src={settings.branding.logo.url} alt={settings.branding.logo.alt || 'Radeo'} fill className="object-contain object-center" priority />
              </div>
            ) : (
              <span
                className="text-2xl font-bold text-[color:var(--color-heading)] hover:text-[color:var(--color-muted)] transition-colors tracking-[0.15em]"
                style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}
              >
                RADEO
              </span>
            )}
          </Link>

          {/* â”€â”€ Right: Icons â”€â”€ */}
          <div className="flex items-center gap-1 flex-1 justify-end">

            {/* Search toggle (desktop) */}
            <button
              onClick={() => setIsSearchBarVisible(!isSearchBarVisible)}
              className="hidden lg:flex w-9 h-9 items-center justify-center text-[color:var(--color-body)] hover:text-[color:var(--color-heading)] transition-colors rounded-full hover:bg-[color:var(--color-subtle-bg)]"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative w-9 h-9 flex items-center justify-center text-[color:var(--color-body)] hover:text-[color:var(--color-heading)] transition-colors rounded-full hover:bg-[color:var(--color-subtle-bg)]" aria-label="Wishlist">
              <div ref={wishlistRef}><FiHeart className="w-5 h-5" /></div>
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 text-[10px] font-bold bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] rounded-full flex items-center justify-center">{wishlistCount}</span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" id="cart-icon-container" className="relative w-9 h-9 flex items-center justify-center text-[color:var(--color-body)] hover:text-[color:var(--color-heading)] transition-colors rounded-full hover:bg-[color:var(--color-subtle-bg)]" aria-label="Cart">
              <div ref={cartRef}><FiShoppingCart className="w-5 h-5" /></div>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 text-[10px] font-bold bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-9 h-9 rounded-full bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] flex items-center justify-center text-xs font-bold hover:bg-[color:var(--color-muted)] transition-colors"
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
                  aria-label="User menu"
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 z-[45] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-[color:var(--color-page-bg)]">
                      <p className="font-semibold text-[color:var(--color-heading)] text-sm">{user?.name}</p>
                      <p className="text-xs text-[color:var(--color-body)] mt-0.5">{user?.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-heading)] hover:bg-[color:var(--color-page-bg)] transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <FiUser className="w-4 h-4 text-[color:var(--color-body)]" /> Profile
                    </Link>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-heading)] hover:bg-[color:var(--color-page-bg)] transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                      <FiPackage className="w-4 h-4 text-[color:var(--color-body)]" /> Orders
                    </Link>
                    {user?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-accent)] bg-[color:var(--color-page-bg)] hover:bg-[color:var(--color-subtle-bg)] transition-colors font-medium" onClick={() => setIsUserMenuOpen(false)}>
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
                className="hidden lg:inline-flex px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] hover:bg-[color:var(--color-muted)] transition-colors"
                style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
              >
                Login
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[color:var(--color-heading)] hover:text-[color:var(--color-body)] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ Search bar (slides down on desktop) â”€â”€ */}
      {isSearchBarVisible && (
        <div ref={searchRef} className="relative z-40 hidden lg:block border-t border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="max-w-[600px] mx-auto px-6 py-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for shoes..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                onFocus={() => setIsSearchOpen(true)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 border border-[color:var(--color-border-light)] rounded-none bg-transparent text-sm text-[color:var(--color-heading)] placeholder-[color:var(--color-body)] focus:outline-none focus:border-[color:var(--color-accent)] transition-colors"
                style={{ fontFamily: "var(--font-cormorant, 'Libre Baskerville', serif)" }}
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-body)] w-4 h-4" />
            </form>

            {/* Results dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-80 overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                {searchResults.map(product => (
                  <Link
                    key={product._id}
                    href={`/products/${product.slug}`}
                    onClick={() => { setIsSearchOpen(false); setIsSearchBarVisible(false); setSearchQuery(''); }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[color:var(--color-page-bg)] transition-colors"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 bg-[color:var(--color-subtle-bg)] rounded">
                      <Image src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.svg'} alt={product.name} fill sizes="56px" className="object-cover rounded" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[color:var(--color-heading)] truncate">{product.name}</h4>
                      <p className="text-xs text-[color:var(--color-body)] uppercase tracking-wider">{product.category?.name}</p>
                      <p className="text-sm font-semibold text-[color:var(--color-accent-hover)]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>{formatPrice(product.price ?? 0)}</p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => { router.push(`/products?search=${encodeURIComponent(searchQuery)}`); setIsSearchOpen(false); setIsSearchBarVisible(false); setSearchQuery(''); }}
                  className="w-full px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.12em] text-[color:var(--color-accent)] hover:bg-[color:var(--color-page-bg)] transition-colors border-t border-gray-100"
                  style={{ fontFamily: "var(--font-dm-mono, monospace)" }}
                >
                  View all results â†’
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ Mobile Menu â”€â”€ */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className="px-6 py-4 space-y-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text" placeholder="Search for shoes..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[color:var(--color-border-light)] text-sm text-[color:var(--color-heading)] placeholder-[color:var(--color-body)] focus:outline-none focus:border-[color:var(--color-accent)] bg-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-body)] w-4 h-4" />
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
                    pathname === link.href ? 'text-[color:var(--color-heading)] bg-[color:var(--color-page-bg)]' : 'text-[color:var(--color-body)]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile categories */}
              <div className="pt-3 border-t border-gray-100">
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-accent)]"
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
                >
                  All Categories
                </Link>
                {categories.map(cat => (
                  <Link
                    key={cat._id}
                    href={`/products?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[color:var(--color-page-bg)] transition-colors"
                  >
                    {cat.image?.url ? (
                      <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-50 relative">
                        <Image src={cat.image.url} alt={cat.name} fill sizes="36px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded bg-[color:var(--color-subtle-bg)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[color:var(--color-muted)] font-bold text-sm">{cat.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm text-[color:var(--color-heading)]">{cat.name}</span>
                  </Link>
                ))}
              </div>

              {/* About & Contact â€” after Categories in mobile too */}
              {navLinksAfterCategories.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
                    pathname === link.href ? 'text-[color:var(--color-heading)] bg-[color:var(--color-page-bg)]' : 'text-[color:var(--color-body)]'
                  }`}
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
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
                    className="block text-center px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)]"
                    style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
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
