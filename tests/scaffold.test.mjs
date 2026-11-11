import { it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, rm, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

it('the lesson command registers a usable file and refuses to overwrite it', async () => {
  await mkdir('.cache', { recursive: true });
  const directory = await mkdtemp(resolve('.cache/scaffold-test-'));
  try {
    await cp('src', join(directory, 'src'), { recursive: true });
    await cp('examples', join(directory, 'examples'), { recursive: true });
    await cp('presentation.config.ts', join(directory, 'presentation.config.ts'));
    const script = resolve('scripts/new-lesson.mjs');
    const run = () =>
      spawnSync(process.execPath, [script, 'new-example', 'An example'], {
        cwd: directory,
        encoding: 'utf8',
      });
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    const created = await readFile(join(directory, 'src/content/new-example.ts'), 'utf8');
    assert.ok(created.includes('"id": "new-example"'));
    const registry = await readFile(join(directory, 'src/content/index.ts'), 'utf8');
    assert.ok(registry.includes("from './new-example'"));
    const repeated = run();
    assert.notEqual(repeated.status, 0);
    assert.ok(repeated.stderr.includes('Activity ID already exists'));
    assert.equal(await readFile(join(directory, 'src/content/new-example.ts'), 'utf8'), created);
    assert.equal(await readFile(join(directory, 'src/content/index.ts'), 'utf8'), registry);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
