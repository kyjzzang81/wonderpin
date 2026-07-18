import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@wonderpin/database', '@wonderpin/ui'],
};

export default config;
