import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
await mkdir('.cache', { recursive: true });
// One deterministic process uses Node's built-in TAP runner. Separate dynamic
// imports ensure jsdom globals exist before Testing Library binds `screen`.
await build({
  entryPoints: [
    'tests/setup.ts',
    'tests/content.test.ts',
    'tests/mathematics.test.ts',
    'tests/td4-mathematics.test.ts',
    'tests/interactions.test.tsx',
    'tests/animation.test.ts',
    'tests/operational.test.ts',
    'tests/playback-controller.test.ts',
  ],
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  outdir: '.cache/tests',
  target: 'node22',
  jsx: 'automatic',
});
// Bundle Motion Canvas itself for the scheduler regression (its published
// extensionless imports otherwise require the browser bundler).
await build({
  entryPoints: ['tests/timing.test.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: '.cache/tests/timing.test.js',
  target: 'node22',
});
await writeFile(
  '.cache/tests/run.mjs',
  "await import('./setup.js');\nawait import('./content.test.js');\nawait import('./mathematics.test.js');\nawait import('./td4-mathematics.test.js');\nawait import('./interactions.test.js');\nawait import('./animation.test.js');\nawait import('./operational.test.js');\nawait import('./playback-controller.test.js');\nawait import('./timing.test.js');\nawait import('../../tests/scaffold.test.mjs');\n",
);
const child = spawn(
  process.execPath,
  [
    '--test',
    '--test-isolation=none',
    '--test-reporter=tap',
    '--test-concurrency=1',
    '.cache/tests/run.mjs',
  ],
  { stdio: 'inherit' },
);
child.on('exit', (code, signal) => {
  process.exitCode = code ?? 1;
  if (signal) console.error('Test runner terminated by ' + signal);
});
child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
