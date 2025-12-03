import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configurar la raíz del workspace para Turbopack
  // Esto evita el warning cuando hay múltiples lockfiles en directorios padre
  turbopack: {
    root: path.resolve(__dirname),
  },
  eslint: {
    // Ignorar warnings durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build (opcional)
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    });
    return config;
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  // Asegurar que las rutas API funcionen correctamente
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
