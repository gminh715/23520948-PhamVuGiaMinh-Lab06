import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    // Enable static generation for documentation pages
    output: 'standalone',
};

export default nextConfig;
