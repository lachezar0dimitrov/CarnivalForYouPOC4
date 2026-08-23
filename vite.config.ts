import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readdirSync } from 'node:fs';

// Exposes the filenames in public/images/carousel/ to client code as
// `import ... from 'virtual:carousel-images'` — used by the admin banner
// form to let admins pick a pre-existing source photo instead of only
// uploading a new file. Re-scans on every dev server start / build, so
// dropping a new file into that folder is enough to make it pickable.
function carouselImagesPlugin(): Plugin {
  const virtualModuleId = 'virtual:carousel-images';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  const carouselDir = fileURLToPath(
    new URL('./public/images/carousel', import.meta.url)
  );

  return {
    name: 'carousel-images',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;
      let files: string[] = [];
      try {
        files = readdirSync(carouselDir)
          .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
          .sort();
      } catch {
        files = [];
      }
      const paths = files.map((f) => `/images/carousel/${f}`);
      return `export default ${JSON.stringify(paths)};`;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), carouselImagesPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
