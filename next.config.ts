import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images served from the local uploads directory
  images: {
    remotePatterns: [],
  },
  // instrumentation.ts is stable in Next.js 15 — no flag needed
}

export default nextConfig
