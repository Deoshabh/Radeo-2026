import { Plus_Jakarta_Sans, Lora, Libre_Baskerville, Space_Mono, Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import AnnouncementBar from '@/components/AnnouncementBar';
import MaintenanceModeGate from '@/components/MaintenanceModeGate';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#8B4513',
};

export const metadata = generateSEOMetadata({
  title: 'Radeo - Premium Handcrafted Shoes',
  description: 'Discover exquisite handcrafted shoes made with premium materials and timeless craftsmanship. Shop the finest collection of luxury footwear at Radeo.',
  keywords: ['shoes', 'handcrafted', 'premium', 'leather', 'oxford', 'derby', 'brogue', 'loafer', 'luxury footwear', 'online shoe store India'],
});

import QueryProvider from '@/providers/QueryProvider';

// ...

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorant.variable} ${jakarta.variable} ${lora.variable} ${baskerville.variable} ${spaceMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.radeo.in" />
        <script src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} async defer></script>
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <SiteSettingsProvider>
                <CartProvider>
                  <WishlistProvider>
                    <Navbar />
                    <main className="page-transition min-h-screen" style={{ paddingTop: 'var(--navbar-offset, 80px)' }}>
                      <AnnouncementBar />
                      <MaintenanceModeGate>{children}</MaintenanceModeGate>
                    </main>
                    <Footer />
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 3000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          duration: 4000,
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />
                  </WishlistProvider>
                </CartProvider>
              </SiteSettingsProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
