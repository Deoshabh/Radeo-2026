'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { isAuthenticated } = useAuth();

  // Hide on admin routes and checkout
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout')) return null;

  const navItems = [
    { href: '/', icon: FiHome, label: 'Home' },
    { href: '/products', icon: FiGrid, label: 'Shop' },
    { href: '/cart', icon: FiShoppingBag, label: 'Bag', badge: cartCount },
    { href: isAuthenticated ? '/profile' : '/auth/login', icon: FiUser, label: 'Account' },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 flex border-t"
      style={{
        zIndex: 1000,
        backgroundColor: 'color-mix(in srgb, var(--color-background, #ffffff) 95%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'var(--color-border, #e5e5e5)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative"
            style={{
              color: isActive
                ? 'var(--color-heading, #1A1714)'
                : 'var(--color-body, #8A8580)',
            }}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 text-[9px] font-bold bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-medium tracking-wide"
              style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}
            >
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px]"
                style={{ backgroundColor: 'var(--color-accent, #B8973A)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
