import { build } from 'esbuild';
import { mkdir, writeFile, copyFile, cp, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import katex from 'katex';
await mkdir('.cache', { recursive: true });
await build({
  stdin: {
    contents:
      "export {exercises} from './src/content'; export {presentation} from './presentation.config'; export {renderPrintSurface, describePrintSurface} from './src/components/print-surfaces';",
    resolveDir: process.cwd(),
  },
  outfile: '.cache/handout.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
});
const { exercises, presentation, renderPrintSurface, describePrintSurface } = await import(
  pathToFileURL(resolve('.cache/handout.mjs')).href + '?' + Date.now()
);
const escape = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const math = (tex) =>
  katex.renderToString(tex, {
    displayMode: true,
    throwOnError: true,
    trust: false,
    strict: 'ignore',
  });
let md = '# ' + presentation.title + '\n\n' + presentation.description + '\n\n';
let body = `<h1>${escape(presentation.title)}</h1><p>${escape(presentation.description)}</p>`;
for (const section of exercises) {
  md += `## ${section.title}\n\n`;
  body += `<section><h2>${escape(section.title)}</h2>`;
  for (const activity of section.activities) {
    md += `### ${activity.label}\n\n${activity.prompt}\n\n$$${activity.tex}$$\n\n`;
    body += `<article><h3>${escape(activity.label)}</h3><p>${escape(activity.prompt)}</p><div class="formula">${math(activity.tex)}</div>`;
    if (activity.note) {
      md += activity.note + '\n\n';
      body += `<aside>${escape(activity.note)}</aside>`;
    }
    for (const [i, step] of activity.steps.entries()) {
      md +=
        `${i + 1}. **${step.title}**\n\n` +
        (step.prose ? step.prose.join('\n\n') : `$$${step.tex}$$`) +
        `\n\n${describePrintSurface(step)}\n\n${step.why}\n\n`;
      body +=
        `<div class="step"><h4>${i + 1}. ${escape(step.title)}</h4>` +
        (step.prose
          ? step.prose.map((p) => `<p>${escape(p)}</p>`).join('')
          : renderPrintSurface(step) || `<div class="formula">${math(step.tex)}</div>`) +
        `<p>${escape(step.why)}</p></div>`;
    }
    md += `$$${activity.result}$$\n\n`;
    body += `<div class="result formula">${math(activity.result)}</div></article>`;
  }
  body += '</section>';
}
const surfaceStyles = await readFile('src/styles.css', 'utf8');
const html = `<!doctype html><html lang="${escape(presentation.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(presentation.title)}</title><link rel="stylesheet" href="assets/katex.min.css"><style>${surfaceStyles}
body{font:17px/1.65 system-ui,sans-serif;color:#14263d;background:#fffefa;margin:0}main{max-width:940px;margin:auto;padding:30px}article{border-top:1px solid #8b99aa;margin:35px 0}.step{margin:26px 0;break-inside:avoid}.formula{overflow:auto}h1,h2{font-family:Georgia,serif}.result{border-top:1px solid #8b99aa;padding:15px}aside{padding:12px;background:#edf1f5}.graph-slide{max-width:760px}.graph-slide svg{max-height:360px}.sign-table{font-size:21px}.sign-table-scroll{padding:8px 0}.step:has(.graph-slide),.step:has(.sign-table){break-inside:avoid}@media print{.graph-slide svg{max-height:310px}.sign-table-scroll{overflow:visible}.sign-table{font-size:18px}body{background:white}main{padding:0}section+section{break-before:page}.formula{overflow:visible}}</style></head><body><main>${body}</main></body></html>`;
await mkdir('public/handout/assets', { recursive: true });
await copyFile('node_modules/katex/dist/katex.min.css', 'public/handout/assets/katex.min.css');
await cp('node_modules/katex/dist/fonts', 'public/handout/assets/fonts', { recursive: true });
await writeFile('public/handout/index.html', html);
await writeFile('public/handout/handout.md', md);
console.log(`Exported ${exercises.length} sections to public/handout (HTML and Markdown).`);
