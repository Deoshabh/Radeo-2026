import { Inter, Playfair_Display } from 'next/font/google';
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

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = generateSEOMetadata({
  title: 'Radeo - Premium Handcrafted Shoes',
  description: 'Discover exquisite handcrafted shoes made with premium materials and timeless craftsmanship.',
  keywords: ['shoes', 'handcrafted', 'premium', 'leather', 'oxford', 'derby', 'brogue', 'loafer'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script src="https://www.google.com/recaptcha/enterprise.js?render=6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl" async defer></script>
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <SiteSettingsProvider>
              <CartProvider>
                <WishlistProvider>
                  <Navbar />
                  <main className="min-h-screen pt-[80px]">
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
      </ErrorBoundary>
      </body>
    </html>
  );
}
