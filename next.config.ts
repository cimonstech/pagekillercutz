import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Google Tag Manager requires its own origin in script-src.
      // 'unsafe-eval' is added in dev only — React needs it for call-stack reconstruction.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // data: covers Material Symbols / Google Fonts data-URI font faces
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://assets.pagekillercutz.com https://*.supabase.co https://*.dzcdn.net https://e-cdns-images.dzcdn.net https://cdns-images.dzcdn.net https://cdn-images.dzcdn.net https://www.googletagmanager.com https://www.google-analytics.com",
      "media-src 'self' blob: https://assets.pagekillercutz.com https://*.dzcdn.net",
      // GA/GTM need connect-src for their measurement + collection endpoints
      "connect-src 'self' https://*.supabase.co https://api.resend.com https://api.letsfish.africa https://api.deezer.com wss://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.pagekillercutz.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "e-cdns-images.dzcdn.net",
      },
      {
        protocol: "https",
        hostname: "cdns-images.dzcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.dzcdn.net",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
