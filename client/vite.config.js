import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  // ✅ PERFORMANCE OPTIMIZATION
  build: {
    target: 'esnext', // ⚡ Generates more efficient modern code (smaller bundle)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. CORE VENDOR (Required for Login Page)
            // Group React, Router, Redux, and basic utilities together.
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@reduxjs') ||
              id.includes('redux') ||
              id.includes('axios')
            ) {
              return 'vendor-core';
            }

            // 2. UI UTILITIES (Required for Shadcn components on Login)
            // Radix UI, Class variance, etc.
            if (
              id.includes('@radix-ui') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge') ||
              id.includes('lucide-react')
            ) {
              return 'vendor-ui';
            }

            // 3. HEAVY DASHBOARD LIBS (Keep these AWAY from Login)
            // If you add charts (Recharts/Chart.js) or Tables later,
            // this ensures they don't slow down the initial login page.
            if (
              id.includes('recharts') ||
              id.includes('chart.js') ||
              id.includes('framer-motion') ||
              id.includes('date-fns') ||
              id.includes('xlsx')
            ) {
              return 'vendor-dashboard';
            }
          }
        },
      },
    },
  },
});
