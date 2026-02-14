import { setupHoneybadger } from '@honeybadger-io/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
    // Image optimization settings
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.BACKEND_INTERNAL_URL ||
          "http://127.0.0.1:5000/api/:path*",
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
