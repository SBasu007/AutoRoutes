import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  
  // SEO Headers Configuration
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), microphone=(), camera=()",
          },
        ],
      },
      // Cache control for static assets
      {
        source: "/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // SEO Redirects
  async redirects() {
    return [
      {
        source: "/",
        destination: "/route-finder",
        permanent: true, // 301 redirect for SEO
      },
      // Common search variations
      {
        source: "/search",
        destination: "/route-finder",
        permanent: false,
      },
      {
        source: "/finder",
        destination: "/route-finder",
        permanent: false,
      },
    ];
  },

  // Rewrite for API routes if needed
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/sitemap.xml",
          destination: "/api/sitemap",
        },
        {
          source: "/robots.txt",
          destination: "/api/robots",
        },
      ],
    };
  },
};

export default nextConfig;

