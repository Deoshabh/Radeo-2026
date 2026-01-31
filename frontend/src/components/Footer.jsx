'use client';

import Link from 'next/link';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-900 text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-serif font-bold mb-4">Radeo</h3>
            <p className="text-primary-300 mb-4">
              Premium handcrafted shoes made with timeless craftsmanship and finest materials.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-brand-tan transition-colors">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-tan transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-brand-tan transition-colors">
                <FiInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-primary-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-primary-300 hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-primary-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/orders" className="text-primary-300 hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-primary-300 hover:text-white transition-colors">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-primary-300 hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-primary-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-primary-300">
                <FiMapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <span>123 Shoe Street, Fashion District, Mumbai 400001</span>
              </li>
              <li className="flex items-center gap-2 text-primary-300">
                <FiPhone className="w-5 h-5" />
                <a href="tel:+911234567890" className="hover:text-white transition-colors">
                  +91 123 456 7890
                </a>
              </li>
              <li className="flex items-center gap-2 text-primary-300">
                <FiMail className="w-5 h-5" />
                <a href="mailto:info@radeo.com" className="hover:text-white transition-colors">
                  info@radeo.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-primary-700 mt-8 pt-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h4>
            <p className="text-primary-300 mb-4">Get updates on new products and exclusive offers</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-primary-800 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-brand-tan text-white placeholder-primary-400"
              />
              <button type="submit" className="btn bg-brand-brown hover:bg-brand-tan text-white px-6">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-300 text-sm">
            © {currentYear} Radeo. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-primary-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-primary-300 hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
