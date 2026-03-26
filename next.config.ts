import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  reactStrictMode: true,
  serverExternalPackages: ['@anthropic-ai/sdk'],
}

export default nextConfig
