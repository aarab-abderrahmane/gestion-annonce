import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
