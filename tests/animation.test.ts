import { it } from 'node:test';
import assert from 'node:assert/strict';
import compiled from '../motion/generated/equations.json';
import type { EquationData } from '../motion/equation-data';
import { activities } from '../src/content';
import {
  activityLayouts,
  arcPoint,
  bounds,
  contextPairs,
  sourcePoses,
  balancePoses,
  simplifyPoses,
} from '../motion/geometry';
import { SETTLED_SECONDS, STEP_SECONDS, BALANCE_SECONDS, SIMPLIFY_SECONDS } from '../motion/timing';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
const data = compiled as unknown as EquationData;

it('changing a highlight never changes glyph outlines, spacing or fraction-bar widths', () => {
  const layouts = new Map<string, unknown>();
  for (const eq of Object.values(data.equations)) {
    const geometry = eq.glyphs.map(({ tags, ...glyph }) => glyph);
    if (layouts.has(eq.tex)) assert.deepEqual(geometry, layouts.get(eq.tex), eq.tex);
    else layouts.set(eq.tex, geometry);
  }
});

it('preserves the visible glyph sequence of every unmarked MathJax expression', () => {
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const doc = mathjax.document('', {
    InputJax: new TeX({ packages: AllPackages }),
    OutputJax: new SVG({ fontCache: 'none' }),
  });
  const cache = new Map<string, string[]>();
  for (const eq of Object.values(data.equations)) {
    if (!cache.has(eq.tex)) {
      const svg = adaptor.outerHTML(
        doc.convert(eq.tex.replaceAll('é', "\\'{e}"), { display: true }),
      );
      assert.ok(!svg.includes('data-mjx-error'));
      cache.set(
        eq.tex,
        [...svg.matchAll(/<(path|rect|line)\b[^>]*>/g)].flatMap((m) =>
          m[1] === 'rect'
            ? ['rule']
            : m[1] === 'line'
              ? ['table-line']
              : /\bd="[^"]+"/.test(m[0])
                ? [/\bdata-c="([^"]+)"/.exec(m[0])![1]]
                : [],
        ),
      );
    }
    assert.deepEqual(
      eq.glyphs.map((g) => g.symbol),
      cache.get(eq.tex),
      eq.tex,
    );
  }
});

it('lays out every step within the stage with finite complete glyph geometry', () => {
  let count = 0;
  for (const a of activities) {
    const steps = data.activities[a.id];
    assert.equal(steps.length, a.steps.length);
    const layouts = activityLayouts(data, steps);
    for (const [i, step] of steps.entries()) {
      assert.equal(data.equations[step.target].tex, a.steps[i].tex);
      const poses = layouts[i],
        box = bounds(poses);
      assert.ok(poses.length > 0);
      assert.ok(
        poses.some((g) => g.tags.includes('focus')),
        `${a.id}/${i}: focus is visible`,
      );
      assert.ok(
        box[0] >= -450 && box[2] <= 450 && box[1] >= -140 && box[3] <= 140,
        `${a.id}/${i}: ${box}`,
      );
      for (const p of poses) {
        assert.ok([p.x, p.y, p.sx, p.sy, ...p.bounds].every(Number.isFinite));
        assert.ok(p.sx > 0 && p.sy < 0);
        assert.ok(data.paths[p.path]);
      }
      if (i) {
        const source = sourcePoses(layouts[i - 1], data.equations[step.source]);
        assert.deepEqual(
          source.map((g) => [g.x, g.y, g.sx, g.sy]),
          layouts[i - 1].map((g) => [g.x, g.y, g.sx, g.sy]),
        );
      }
      count++;
    }
  }
  assert.equal(
    count,
    activities.reduce((sum, activity) => sum + activity.steps.length, 0),
  );
});
it('anchors all products and collections to their source terms and destination', () => {
  let products = 0,
    collections = 0;
  for (const a of activities)
    for (const [i, s] of a.steps.entries())
      if (s.product || s.collect) {
        const p = data.activities[a.id][i],
          from = data.equations[p.source],
          to = data.equations[p.target];
        assert.ok(p.work);
        for (const tag of ['left', 'right'])
          assert.ok(
            from.glyphs.some((g) => g.tags.includes(tag)),
            `${a.id}/${i}/${tag}`,
          );
        assert.ok(!from.glyphs.some((g) => g.tags.includes('left') && g.tags.includes('right')));
        assert.ok(to.glyphs.some((g) => g.tags.includes('result')));
        assert.equal(data.equations[p.work!.result].tex, (s.product || s.collect)!.result);
        if (s.collect) {
          assert.equal(data.equations[p.work!.via!].tex, s.collect.via);
          collections++;
        } else products++;
      }
  assert.equal(products, activities.flatMap((a) => a.steps).filter((s) => s.product).length);
  assert.equal(collections, activities.flatMap((a) => a.steps).filter((s) => s.collect).length);
});
it(
  'example: retains the base 7 while its exponents are assembled and simplified',
  { skip: !data.activities['1q2'] },
  () => {
    const layouts = activityLayouts(data, data.activities['1q2']);
    const bases = layouts.map((ps) => ps.find((p) => p.symbol === '37')!);
    assert.ok(bases.every(Boolean));
    for (const p of bases.slice(1)) {
      assert.ok(Math.abs(p.x - bases[0].x) < 0.001);
      assert.ok(Math.abs(p.y - bases[0].y) < 0.001);
    }
    const transition = data.activities['1q2'][3];
    const from = sourcePoses(layouts[2], data.equations[transition.source]);
    const to = layouts[3];
    const sourceExponent = from.find((p) => p.tags.includes('exponentRight'))!;
    const targetExponent = to.find((p) => p.tags.includes('exponentRight'))!;
    assert.equal(sourceExponent.symbol, '32');
    assert.equal(targetExponent.symbol, '32');
    assert.ok(Math.abs(sourceExponent.y - targetExponent.y) > 20);
  },
);
it('preserves occurrence order and moves along a continuous path with exact endpoints', () => {
  const compiledStep = Object.values(data.activities)[0][0];
  const from = data.equations[compiledStep.source].glyphs;
  const to = data.equations[compiledStep.target].glyphs;
  const pairs = contextPairs(from, to);
  for (let n = 1; n < pairs.length; n++) {
    assert.ok(pairs[n][0] > pairs[n - 1][0] && pairs[n][1] > pairs[n - 1][1]);
  }
  assert.deepEqual(arcPoint([10, 20], [110, 20], 0), [10, 20]);
  const end = arcPoint([10, 20], [110, 20], 1);
  assert.ok(Math.abs(end[0] - 110) < 1e-10 && Math.abs(end[1] - 20) < 1e-10);
  assert.ok(arcPoint([10, 20], [110, 20], 0.5)[1] < 20);
  assert.ok(SETTLED_SECONDS > 6.1 && STEP_SECONDS > SETTLED_SECONDS);
});

it('never borrows a matching glyph from the changed middle of an unrelated rewrite', () => {
  const make = (text: string) =>
    [...text].map((path) => ({ path })) as Parameters<typeof contextPairs>[0];
  assert.deepEqual(contextPairs(make('a1x+b'), make('a2x-b')), [
    [0, 0],
    [4, 4],
  ]);
  assert.deepEqual(contextPairs(make('123'), make('321')), []);
});

it('every new mathematical statement has an explicit presentation boundary', () => {
  for (const a of activities) {
    for (const [i, s] of a.steps.entries()) {
      assert.equal(!!data.activities[a.id][i].statement, !!s.statement, `${a.id}/${i}`);
      if (s.title === 'Écrire la formule de la seconde racine') {
        assert.equal(s.phase, 'Calculer la seconde racine');
        assert.equal(s.statement, true);
      }
      if (s.title === 'Chercher les zéros du trinôme') assert.equal(s.statement, true);
    }
  }
});

it('keeps operational intermediates, results and nonzero hypotheses in separate visible regions', () => {
  let balances = 0,
    simplifications = 0,
    cancellations = 0;
  const fits = (poses: ReturnType<typeof sourcePoses>) => {
    if (!poses.length) return;
    const box = bounds(poses);
    assert.ok(
      box[0] >= -450 && box[2] <= 450 && box[1] >= -190 && box[3] <= 190,
      `working geometry: ${box}`,
    );
  };
  for (const steps of Object.values(data.activities))
    for (const step of steps) {
      if (step.balance) {
        const p = balancePoses(data, step);
        Object.values(p).forEach(fits);
        assert.ok(
          bounds(p.intermediate)[3] + 12 < bounds(p.output)[1],
          'intermediate and reduced result are distinct lines',
        );
        if (p.condition.length)
          assert.ok(
            bounds(p.output)[3] + 12 < bounds(p.condition)[1],
            'fraction results do not touch the sign condition',
          );
        assert.ok(
          bounds(p.operand)[3] + 12 < bounds(p.source)[1],
          'operand appears above the original relation',
        );
        for (const role of ['memberLeft', 'memberRight', 'operandLeft', 'operandRight', 'relation'])
          assert.ok(
            p.intermediate.some((g) => g.tags.includes(role)),
            `balance role ${role}`,
          );
        for (const role of ['memberLeft', 'memberRight', 'relation'])
          assert.ok(
            p.output.some((g) => g.tags.includes(role)),
            `reduced member role ${role}`,
          );
        balances++;
      }
      if (step.simplify) {
        const p = simplifyPoses(data, step);
        Object.values(p).forEach(fits);
        assert.ok(
          bounds(p.source)[3] + 20 < bounds(p.equality)[1],
          'source and equality leave room for the copy arrow',
        );
        if (p.condition.length)
          assert.ok(
            bounds(p.equality)[3] + 12 < bounds(p.condition)[1],
            'local equality does not overlap its condition',
          );
        for (const role of ['replacement', 'relation', 'result'])
          assert.ok(
            p.equality.some((g) => g.tags.includes(role)),
            `simplification role ${role}`,
          );
        if (step.simplify.cancel) {
          const factor = p.equality.filter((g) => g.tags.includes('cancelFactor'));
          const denominator = p.equality.filter((g) => g.tags.includes('cancelDenominator'));
          assert.ok(factor.length && denominator.length);
          assert.deepEqual(
            factor.map((g) => g.path),
            denominator.map((g) => g.path),
          );
          assert.ok(!factor.some((g) => g.tags.includes('cancelDenominator')));
          cancellations++;
        }
        simplifications++;
      }
    }
  assert.ok(balances >= 1 && simplifications >= 1 && cancellations >= 1);
  assert.ok(Math.max(BALANCE_SECONDS, SIMPLIFY_SECONDS) + 0.25 < SETTLED_SECONDS);
});
