/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase-admin');
    }
    return config;
  },
  transpilePackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  experimental: {
    esmExternals: 'loose',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://apis.google.com https://www.google.com https://www.gstatic.com https://*.recaptcha.net https://recaptcha.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://maps.gstatic.com https://maps.googleapis.com https://firebasestorage.googleapis.com https://*.googleapis.com https://*.googleusercontent.com;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://maps.googleapis.com https://www.google.com https://*.recaptcha.net https://recaptcha.net;
      frame-src 'self' https://*.firebaseapp.com https://www.google.com https://recaptcha.google.com https://*.recaptcha.net https://recaptcha.net;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
