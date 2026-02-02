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
        hostname: "minio-api.radeo.in",
        pathname: "/product-media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
    ],
    // Use custom loader to bypass Next.js optimization for external images
    loader: "custom",
    loaderFile: "./src/utils/imageLoader.js",
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
