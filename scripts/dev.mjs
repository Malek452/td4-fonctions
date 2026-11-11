import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { resolve } from 'node:path';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let server,
  worker,
  closing = false,
  dirty = false,
  running = false,
  debounce;
const watchers = [];
function execute(command, args) {
  return new Promise((resolve, reject) => {
    worker = spawn(command, args, { stdio: 'inherit' });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      worker = undefined;
      code === 0 ? resolve() : reject(new Error(`Build exited ${code}`));
    });
  });
}
async function stopServer() {
  if (!server) return;
  const old = server;
  server = undefined;
  if (old.exitCode !== null || old.signalCode !== null) return;
  await new Promise((resolve) => {
    old.once('exit', resolve);
    old.kill('SIGTERM');
  });
}
async function rebuild() {
  if (running || closing) return;
  running = true;
  try {
    while (dirty && !closing) {
      dirty = false;
      await stopServer();
      console.log('\nRebuilding authored content and Motion Canvas…');
      await execute(npm, ['run', 'build:motion']);
    }
    if (!closing) {
      server = spawn(
        process.execPath,
        [resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', ...process.argv.slice(2)],
        { stdio: 'inherit' },
      );
      server.once('error', (error) => console.error(error));
    }
  } catch (error) {
    console.error(error.message + '\nFix the content and save to retry.');
  } finally {
    running = false;
  }
}
function schedule(path) {
  if (
    path &&
    String(path)
      .split(/[\\/]/)
      .some((p) => p === 'generated' || p.endsWith('.meta'))
  )
    return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    dirty = true;
    void rebuild();
  }, 350);
}
for (const path of ['src/content', 'examples', 'motion'])
  watchers.push(watch(path, { recursive: true }, (_, file) => schedule(file)));
for (const path of [
  'presentation.config.ts',
  'src/types.ts',
  'src/theme.ts',
  'src/ui.ts',
  'src/components/focus.ts',
  'scripts/prepare-equations.mjs',
  'scripts/math-svg.mjs',
])
  watchers.push(watch(path, () => schedule(path)));
async function close() {
  if (closing) return;
  closing = true;
  clearTimeout(debounce);
  watchers.forEach((w) => w.close());
  worker?.kill('SIGTERM');
  await stopServer();
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
dirty = true;
await rebuild();
