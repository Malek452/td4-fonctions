import { defineConfig } from 'vite';
import motionCanvasPackage from '@motion-canvas/vite-plugin';
const motionCanvas =
  typeof motionCanvasPackage === 'function'
    ? motionCanvasPackage
    : (motionCanvasPackage as unknown as { default: typeof motionCanvasPackage }).default;
// Separate JSX and build pipeline: React never compiles Motion Canvas scenes.
export default defineConfig({
  plugins: [
    motionCanvas({ project: './motion/project.ts' }),
    {
      name: 'atelier-player-entry',
      enforce: 'post',
      config() {
        return { build: { rollupOptions: { input: { player: './motion/player.ts' } } } };
      },
    },
  ],
  build: {
    manifest: 'manifest.json',
    outDir: 'public/animations',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'es2022',
    rollupOptions: {
      output: { entryFileNames: '[name]-[hash].js', chunkFileNames: '[name]-[hash].js' },
    },
  },
});
