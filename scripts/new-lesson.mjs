import { build } from 'esbuild';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const [slug, ...words] = process.argv.slice(2);
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: npm run new:lesson -- my-lesson "My lesson title"');
  process.exit(1);
}
const registryPath = resolve('src/content/index.ts');
const registry = await readFile(registryPath, 'utf8');
for (const marker of ['// @new-lesson-import', '// @new-lesson-entry']) {
  if (registry.split(marker).length !== 2)
    throw new Error('Expected one registry marker: ' + marker);
}
await mkdir('.cache', { recursive: true });
await build({
  entryPoints: ['src/content/index.ts'],
  outfile: '.cache/scaffold-content.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
});
const { exercises } = await import(
  pathToFileURL(resolve('.cache/scaffold-content.mjs')).href + '?' + Date.now()
);
if (exercises.some((e) => e.activities.some((a) => a.id === slug)))
  throw new Error('Activity ID already exists: ' + slug);
const id = Math.max(...exercises.map((e) => e.id)) + 1;
const binding = 'lesson' + id;
const title = words.join(' ').trim() || slug;
const activity = {
  id: slug,
  label: title,
  prompt: 'Résoudre dans ℝ.',
  tex: 'x+1=3',
  result: 'x=2',
  visual: 'algebra',
  steps: [
    {
      title: 'Lire l’équation',
      tex: 'x+1=3',
      why: 'Les deux membres sont définis pour tout réel x.',
      phase: 'Énoncé',
    },
    {
      title: 'Soustraire 1 aux deux membres',
      tex: 'x=3-1',
      why: 'Soustraire le même nombre aux deux membres donne une équation équivalente.',
      focus: '3-1',
    },
    {
      title: 'Calculer et conclure',
      tex: 'x=2',
      why: '3 − 1 = 2. Cette valeur est l’unique solution et vérifie 2 + 1 = 3.',
      phase: 'Conclusion',
    },
  ],
};
const section = {
  id,
  title,
  short: title,
  theme: 'À personnaliser',
  level: 'Introduction',
  minutes: 5,
  description: 'Remplacer cet exemple par votre contenu vérifié.',
  objectives: ['Résoudre et justifier'],
  prerequisites: ['Égalités'],
  color: 'sage',
  activities: [activity],
};
const file = resolve(`src/content/${slug}.ts`);
await writeFile(
  file,
  "import type { Exercise } from '../types';\nexport default " +
    JSON.stringify(section, null, 2) +
    ' satisfies Exercise;\n',
  { flag: 'wx' },
);
try {
  await writeFile(
    registryPath,
    registry
      .replace(
        '// @new-lesson-import',
        `import ${binding} from './${slug}';\n// @new-lesson-import`,
      )
      .replace('// @new-lesson-entry', `${binding},\n  // @new-lesson-entry`),
  );
} catch (error) {
  await unlink(file);
  throw error;
}
console.log(
  `Created src/content/${slug}.ts and registered it. Edit its content, then run npm run validate.`,
);
console.log(`Stable link: #activity/${slug}`);
