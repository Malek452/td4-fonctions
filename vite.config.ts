import { presentation } from './presentation.config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// The React build follows the Motion Canvas build. A fingerprinted entry keeps
// returning students from loading an older player from their browser cache.
const motionManifest = JSON.parse(
  readFileSync(new URL('./public/animations/manifest.json', import.meta.url), 'utf8'),
);
const playerFile = motionManifest['motion/player.ts']?.file;
if (!playerFile) throw new Error('Run npm run build:motion before starting the React app.');
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'presentation-metadata',
      transformIndexHtml(html) {
        const escape = (s: string) =>
          s
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
        return html
          .replace(/<title>.*?<\/title>/, () => '<title>' + escape(presentation.title) + '</title>')
          .replace(/<html lang="[^"]*"/, () => '<html lang="' + presentation.locale + '"')
          .replace(
            /<meta name="description" content="[^"]*"/,
            () => '<meta name="description" content="' + escape(presentation.description) + '"',
          );
      },
    },
  ],
  define: { __MOTION_PLAYER_URL__: JSON.stringify(`animations/${playerFile}`) },
  build: { target: 'es2022' },
});
