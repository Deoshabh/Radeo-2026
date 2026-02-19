import { setupHoneybadger } from '@honeybadger-io/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "backend",
        port: "5000",
        pathname: "/api/media/**",
      },
      {
        protocol: "https",
        hostname: "minio.radeo.in",
        pathname: "/product-media/**",
      },
      {
        protocol: "https",
        hostname: "cdn.radeo.in",
        pathname: "/product-media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Image optimization settings
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
  },

  async redirects() {
    return [
      {
        source: "/admin/storefront-builder",
        destination: "/admin/cms",
        permanent: true,
      },
      {
        source: "/admin/visual-editor",
        destination: "/admin/cms",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000"}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://apis.google.com https://*.firebaseio.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://cdn.radeo.in https://minio.radeo.in https://images.unsplash.com https://*.googleusercontent.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.radeo.in https://cdn.radeo.in https://*.firebaseio.com https://*.googleapis.com https://checkout.razorpay.com wss://*.radeo.in https://api.honeybadger.io https://challenges.cloudflare.com",
              "frame-src https://checkout.razorpay.com https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default setupHoneybadger(nextConfig, {
  reportData: true,
  silent: false,
  apiKey: process.env.HONEYBADGER_API_KEY,
  assetsUrl: process.env.NEXT_PUBLIC_ASSETS_URL || 'https://radeo.in',
  revision: process.env.GIT_COMMIT_SHA,
});
