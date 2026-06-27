/** @type {import('next').NextConfig} */
const nextConfig = {
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'tokkobroker.com' },
    ],
  },

  // Suprimir advertencias de dependencias externas
  experimental: {
    serverComponentsExternalPackages: ['@langchain/openai', 'langchain'],
  },
}

export default nextConfig
