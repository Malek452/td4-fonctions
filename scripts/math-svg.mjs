import { createHash } from 'node:crypto';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import parsePath from 'parse-svg-path';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const document = mathjax.document('', {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: 'none' }),
});
const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 20);
const round = (n) => Math.round(n * 100000) / 100000;
const identity = [1, 0, 0, 1, 0, 0];
const multiply = (a, b) => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
function transform(value = '') {
  let matrix = identity;
  for (const [, name, args] of value.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const next =
      name === 'translate'
        ? [1, 0, 0, 1, v[0], v[1] || 0]
        : name === 'scale'
          ? [v[0], 0, 0, v[1] ?? v[0], 0, 0]
          : name === 'matrix' && v.length === 6
            ? v
            : null;
    if (!next) throw new Error('Unsupported MathJax transform: ' + value);
    matrix = multiply(matrix, next);
  }
  return matrix;
}
// MathJax glyph outlines use these commands. Control points provide conservative
// bounds, so accents and curves cannot be clipped by the underline or reveal.
function pathBounds(path) {
  let x = 0,
    y = 0,
    start = [0, 0],
    quadratic = null,
    cubic = null;
  const points = [];
  for (const [command, ...args] of parsePath(path)) {
    const name = command.toUpperCase(),
      relative = command !== name;
    const ox = relative ? x : 0,
      oy = relative ? y : 0;
    if (name === 'Z') {
      [x, y] = start;
      quadratic = cubic = null;
      continue;
    }
    if (name === 'H') {
      x = args[0] + ox;
      points.push([x, y]);
      quadratic = cubic = null;
      continue;
    }
    if (name === 'V') {
      y = args[0] + oy;
      points.push([x, y]);
      quadratic = cubic = null;
      continue;
    }
    if (!['M', 'L', 'Q', 'T', 'C', 'S'].includes(name))
      throw new Error('Unsupported MathJax path command: ' + command);
    const reflected =
      name === 'T' && quadratic
        ? [2 * x - quadratic[0], 2 * y - quadratic[1]]
        : name === 'S' && cubic
          ? [2 * x - cubic[0], 2 * y - cubic[1]]
          : [x, y];
    if (name === 'T' || name === 'S') points.push(reflected);
    quadratic = name === 'Q' ? [args[0] + ox, args[1] + oy] : name === 'T' ? reflected : null;
    cubic =
      name === 'C'
        ? [args[2] + ox, args[3] + oy]
        : name === 'S'
          ? [args[0] + ox, args[1] + oy]
          : null;
    for (let i = 0; i < args.length; i += 2) points.push([args[i] + ox, args[i + 1] + oy]);
    [x, y] = points.at(-1);
    if (name === 'M') start = [x, y];
  }
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
  ];
}

/** Noncrossing source ranges become SVG groups; no animation-marker syntax. */
export function tagTex(tex, ranges) {
  const merged = [];
  for (const range of ranges) {
    if (range.start < 0 || range.end > tex.length || range.start >= range.end)
      throw new Error('Invalid mathematical selection: ' + tex);
    const same = merged.find((r) => r.start === range.start && r.end === range.end);
    if (same) same.tags.push(range.tag);
    else merged.push({ ...range, tags: [range.tag] });
  }
  merged.sort((a, b) => a.start - b.start || b.end - a.end);
  for (let i = 0; i < merged.length; i++)
    for (let j = i + 1; j < merged.length; j++) {
      const a = merged[i],
        b = merged[j];
      if (a.start < b.start && b.start < a.end && a.end < b.end)
        throw new Error('Crossing mathematical selections: ' + tex);
    }
  let out = '';
  for (let i = 0; i <= tex.length; i++) {
    for (const r of merged.filter((r) => r.end === i).reverse()) out += '}}';
    for (const r of merged.filter((r) => r.start === i)) out += `{\\class{${r.tags.join(' ')}}{`;
    out += tex[i] || '';
  }
  return out;
}

export function createEquationCompiler() {
  const paths = {},
    equations = {},
    boxes = new Map(),
    canonical = new Map();
  function render(tex, tagged) {
    // MathJax's SVG font has a vector acute accent; the literal Unicode é would
    // otherwise become a browser-font <text> node, ignored by Canvas SVG import.
    const root = document.convert(tagged.replaceAll('é', "\\'{e}"), { display: true });
    const html = adaptor.outerHTML(root);
    if (html.includes('data-mjx-error')) throw new Error('Invalid tagged TeX: ' + tagged);
    const svg = adaptor.childNodes(root).find((n) => adaptor.kind(n) === 'svg');
    const [vx, vy, width, height] = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
    const glyphs = [],
      unit = 52 / 1000;
    function visit(node, matrix = identity, tags = []) {
      const kind = adaptor.kind(node);
      if (kind === '#text' || kind === 'title' || kind === 'defs') return;
      const current = multiply(matrix, transform(adaptor.getAttribute(node, 'transform')));
      const currentTags = [
        ...tags,
        ...(adaptor.getAttribute(node, 'class') || '').trim().split(/\s+/).filter(Boolean),
      ];
      let data = adaptor.getAttribute(node, 'd');
      let symbol = adaptor.getAttribute(node, 'data-c');
      if (kind === 'line') {
        // MathJax draws array separators as stroked lines, not glyph paths.
        // Its mtable wrapper defines mjx-solid as a 70-unit stroke.
        const x1 = +(adaptor.getAttribute(node, 'x1') || 0),
          x2 = +(adaptor.getAttribute(node, 'x2') || 0),
          y1 = +(adaptor.getAttribute(node, 'y1') || 0),
          y2 = +(adaptor.getAttribute(node, 'y2') || 0);
        const stroke = parseFloat(adaptor.getAttribute(node, 'stroke-width') || '70');
        if (x1 !== x2 && y1 !== y2) throw new Error('Unsupported diagonal table separator: ' + tex);
        const x = x1 === x2 ? x1 - stroke / 2 : Math.min(x1, x2),
          y = y1 === y2 ? y1 - stroke / 2 : Math.min(y1, y2),
          w = x1 === x2 ? stroke : Math.abs(x2 - x1),
          h = y1 === y2 ? stroke : Math.abs(y2 - y1);
        data = `M${x} ${y}h${w}v${h}h${-w}Z`;
        symbol = 'table-line';
      }
      if (kind === 'rect') {
        const x = +(adaptor.getAttribute(node, 'x') || 0),
          y = +(adaptor.getAttribute(node, 'y') || 0);
        const w = +adaptor.getAttribute(node, 'width'),
          h = +adaptor.getAttribute(node, 'height');
        data = `M${x} ${y}h${w}v${h}h${-w}Z`;
        symbol = 'rule';
      }
      if (kind === 'text' || kind === 'use') throw new Error('Unsupported glyph in: ' + tex);
      if (data) {
        if (current[1] || current[2]) throw new Error('Skewed glyph in: ' + tex);
        const id = digest(data);
        paths[id] = data;
        if (!boxes.has(id)) boxes.set(id, pathBounds(data));
        const b = boxes.get(id),
          x = (current[4] - vx - width / 2) * unit,
          y = (current[5] - vy - height / 2) * unit,
          sx = current[0] * unit,
          sy = current[3] * unit;
        glyphs.push({
          path: id,
          symbol: symbol || id,
          x: round(x),
          y: round(y),
          sx: round(sx),
          sy: round(sy),
          bounds: [
            Math.min(b[0] * sx, b[2] * sx) + x,
            Math.min(b[1] * sy, b[3] * sy) + y,
            Math.max(b[0] * sx, b[2] * sx) + x,
            Math.max(b[1] * sy, b[3] * sy) + y,
          ].map(round),
          tags: [...new Set(currentTags)],
        });
      }
      for (const child of adaptor.childNodes(node)) visit(child, current, currentTags);
    }
    visit(svg);
    if (!glyphs.length) throw new Error('Empty equation: ' + tex);
    return { tex, width: round(width * unit), height: round(height * unit), glyphs };
  }
  function compile(tex, ranges = []) {
    const tagged = tagTex(tex, ranges),
      key = digest(tagged);
    if (equations[key]) return key;
    if (!canonical.has(tex)) canonical.set(tex, render(tex, tex));
    const original = canonical.get(tex);
    const marked = ranges.length ? render(tex, tagged) : original;
    // TeX grouping can change binary-operator spacing and hence fraction-bar
    // widths. Markup supplies semantic labels ONLY; the unmarked formula is
    // always the single authority for outlines, positions, sizes and spacing.
    if (
      original.glyphs.length !== marked.glyphs.length ||
      original.glyphs.some((g, i) => g.symbol !== marked.glyphs[i].symbol)
    )
      throw new Error('A selection changes the mathematical symbols: ' + tex);
    equations[key] = {
      ...original,
      glyphs: original.glyphs.map((g, i) => ({ ...g, tags: marked.glyphs[i].tags })),
    };
    return key;
  }
  return { compile, paths, equations };
}
