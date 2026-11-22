import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // Default is 1MB — too small for a multi-month bank statement PDF/XLSX.
      bodySizeLimit: "10mb",
    },
  },
  // pdfjs-dist (used by pdf-parse) loads its worker script via a dynamic
  // import relative to its own file — when bundled by Turbopack the worker
  // ends up at a different path than pdfjs-dist expects, so PDF parsing
  // fails with "Setting up fake worker failed: Cannot find module
  // '.../pdf.worker.mjs'" inside server actions. Excluding both from
  // bundling makes Next require them directly via Node's own resolver at
  // runtime instead, where pdfjs-dist finds its worker file correctly.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
