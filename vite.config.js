import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Base public path - use relative paths in production so the built site
  // works when served from GitHub Pages or any subpath without needing
  // the repo name. Use '/' for dev server.
  base: mode === 'production' ? './' : '/',

  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for debugging
    sourcemap: true,

    // Minify with esbuild (faster and no extra dependency)
    minify: 'esbuild',

    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor libraries
          'vendor-markdown': ['marked'],
          'vendor-highlight': ['highlight.js'],
        },

        // Asset file naming
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,

    // Target modern browsers
    target: 'es2015',
  },

  // Server configuration for development
  server: {
    port: 3000,
    open: true,
    cors: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    open: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['marked', 'highlight.js'],
  },
}));
