import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';

// Dynamic manifest loading based on browser target
const browser = process.env.BROWSER || 'chrome';

// Load appropriate manifest
const getManifest = async () => {
  if (browser === 'firefox') {
    return (await import('./manifest.firefox.json')).default;
  }
  return (await import('./manifest.chrome.json')).default;
};

export default defineConfig(async () => {
  const manifest = await getManifest();

  return {
    plugins: [
      react(),
      crx({ manifest }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: `dist/${browser}`,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
  };
});
