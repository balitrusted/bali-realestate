import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal output for Vercel (helps stay under 250 MB limit)
  output: "standalone",
  // Reduce serverless function size (Vercel 250 MB limit)
  serverExternalPackages: [
    "@vercel/blob",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "@tiptap/extension-underline",
  ],
  outputFileTracingExcludes: {
    "*": [
      ".next/cache/**",
      "node_modules/@swc/**",
      "node_modules/next/dist/compiled/**",
      "node_modules/next/dist/server/**/compiled/**",
      "node_modules/**/*.md",
      "node_modules/**/README*",
      "node_modules/**/LICENSE*",
      "node_modules/**/test/**",
      "node_modules/**/tests/**",
      "node_modules/**/docs/**",
      "node_modules/**/*.map",
      "node_modules/.cache/**",
      "node_modules/eslint/**",
      "node_modules/typescript/**",
      "node_modules/csv-parse/**",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      // Vercel Blob public URLs (production uploads)
      // Example: https://<store>.public.blob.vercel-storage.com/properties/...
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      // Fallback in case URL format differs
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
