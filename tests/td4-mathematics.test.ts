import { it } from 'node:test';
import assert from 'node:assert/strict';
import { activities } from '../src/content';
import { renderPrintSurface } from '../src/components/print-surfaces';
import type { Activity } from '../src/types';

// Oracles are derived from the supplied TD 4 equations, independently of the
// authored transformations. Numerical samples supplement the exact reductions;
// they are not presented to students as mathematical proofs.
const t = String.raw;
const compact = (s: string) => s
  .replace(/\\(?:left|right|,|;|!|quad|qquad)/g, '')
  .replace(/\\(?:dfrac|tfrac)/g, '\\frac')
  .replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}')
  .replace(/(?<!\\)[{}]/g, '')
  .replace(/\s+/g, '');
const activity = (id: string): Activity => {
  const found = activities.find((item) => item.id === `td4-${id}`);
  assert.ok(found, `The active deck must cover worksheet question ${id}`);
  return found;
};
const close = (actual: number, expected: number, message = '') => {
  assert.ok(Number.isFinite(actual) && Number.isFinite(expected), message);
  assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)),
    `${message}: ${actual} != ${expected}`);
};
const hasFormula = (a: Activity, formula: string) => a.steps.some(
  (step) => compact(step.tex).includes(compact(formula)),
);
const unique = (values: number[]) => values.sort((a, b) => a - b).filter(
  (value, index, sorted) => index === 0 || Math.abs(value - sorted[index - 1]) > 1e-10,
);

it('covers the eleven supplied questions and their original domains', () => {
  const expectedDomains: Record<string, string> = {
    '1a': t`]0;+\infty[`, '1b': t`]1;+\infty[`, '1c': t`]1;+\infty[`,
    '2a': t`\mathbb R`, '2b': t`\mathbb R`,
    '3a': t`\mathbb R`, '3b': t`\mathbb R`, '4': t`\mathbb R`,
    '5': t`[-\pi;\pi]`, '6': t`[-\pi;\pi]`, '7': t`[0;2\pi[`,
  };
  for (const [id, domain] of Object.entries(expectedDomains)) {
    const a = activity(id);
    assert.equal(compact(a.initialDomain ?? ''), compact(domain), `${id}: original domain`);
    assert.ok(a.result.trim(), `${id}: explicit result`);
  }
});

it('the original logarithmic domains keep strict inequalities at all boundaries', () => {
  const points = [-10, -2, -1.001, -1, -0.999, -0.1, 0, 0.1, 0.999, 1, 1.001, 2, 10];
  for (const x of points) {
    assert.equal(x * x + 1 > 0 && x - 1 > 0 && x + 1 > 0, x > 1, `1b at ${x}`);
    assert.equal(x * x - 1 > 0 && x > 0 && x * x + 1 > 0, x > 1, `1c at ${x}`);
  }
  assert.ok(hasFormula(activity('1a'), 'x^3'));
  assert.ok(hasFormula(activity('1b'), t`\frac{x^2+1}{x^2-1}`));
  assert.ok(hasFormula(activity('1c'), t`\frac{\sqrt{x^2-1}}{x(x^2+1)}`));
});

it('simplified formulas agree on the original domains and can have larger domains', () => {
  for (const x of [0.001, 0.2, 0.75, 1, 3, 10])
    close(Math.exp(4 * Math.log(x) - Math.log(x)), x ** 3, `1a at ${x}`);
  for (const x of [1.001, 1.25, 2, 3, 10]) {
    close(Math.exp(Math.log(x * x + 1) - Math.log(x - 1) - Math.log(x + 1)),
      (x * x + 1) / (x * x - 1), `1b at ${x}`);
    close(Math.exp(0.5 * Math.log(x * x - 1) - Math.log(x) - Math.log(x * x + 1)),
      Math.sqrt(x * x - 1) / (x * (x * x + 1)), `1c at ${x}`);
  }
  for (const x of [-3, -1, -0.5, 0, 0.5, 1, 3]) {
    assert.equal(Number.isFinite((x * x + 1) / (x * x - 1)), x !== -1 && x !== 1);
    assert.equal(Number.isFinite(Math.sqrt(x * x - 1) / (x * (x * x + 1))),
      x <= -1 || x >= 1, `domain of the simplified expression 1c at ${x}`);
  }
  close(Math.sqrt(1 - 1) / (1 * (1 + 1)), 0, 'The simplified formula is defined at 1');
  assert.ok(Math.sqrt(4 - 1) / (-2 * (4 + 1)) < 0,
    'The added negative branch is an extension, not the original exponential expression');
});

it('exercise 2 zeros and parity follow from positivity and exact algebra', () => {
  const f = (x: number) => x * Math.exp(x * x);
  const g = (x: number) => Math.log(x * x + x + 1);
  for (const x of [-3, -1, -0.5, 0, 0.5, 1, 3]) {
    assert.ok(Math.exp(x * x) > 0);
    assert.equal(f(x) === 0, x === 0);
    close(f(-x), -f(x), 'Oddness of x exp(x²)');
    close(x * x + x + 1, (x + 0.5) ** 2 + 0.75);
    assert.ok(x * x + x + 1 >= 0.75, 'Logarithm argument strictly positive on R');
    close(x * x + x, x * (x + 1), 'The zero equation factors exactly');
    assert.equal(g(x) === 0, x === -1 || x === 0);
  }
  close(g(-1), 0);
  close(g(1), Math.log(3));
  assert.notEqual(g(-1), g(1), 'Not even');
  assert.notEqual(g(-1), -g(1), 'Not odd');
  assert.ok(hasFormula(activity('2a'), t`Z_f=\{0\}`));
  assert.ok(hasFormula(activity('2a'), t`f(-x)=-f(x)`));
  assert.ok(hasFormula(activity('2b'), t`Z_f=\{-1;0\}`));
});

it('the sign table of x²−1 and domain diagrams distinguish logarithm and square-root endpoints', () => {
  const frame = activity('1c').steps.find((step) => step.table?.selectedIntervals)?.table;
  assert.ok(frame);
  assert.deepEqual(frame.model.points.map((p) => p.value), [-1, 1]);
  assert.deepEqual(frame.selectedIntervals, [0, 2]);
  assert.deepEqual(frame.selectedPoints, [], 'The logarithm rejects both zero arguments');
  for (const [i, x] of [-2, 0, 2].entries())
    assert.equal(frame.model.rows.at(-1)!.intervals[i], x * x - 1 > 0 ? '+' : '-');
  for (const [graph, originalEndpoint, simplifiedIncluded] of [
    ['domain-extension-a', 0, false],
    ['domain-extension-b', 1, false],
    ['domain-extension-c', 1, true],
  ] as const) {
    const host = document.createElement('div');
    host.innerHTML = renderPrintSurface({ graph, title: 'Domaines', tex: 'x', why: 'Comparer les conditions' });
    const original = host.querySelector('[data-domain="original"]');
    assert.ok(original);
    assert.equal(Number(original.getAttribute('data-value')), originalEndpoint);
    assert.ok(original.classList.contains('excluded-endpoint'));
    const endpoints = [...host.querySelectorAll('[data-domain="simplified"]')];
    assert.deepEqual(endpoints.map((p) => Number(p.getAttribute('data-value'))), graph === 'domain-extension-a' ? [] : [-1, 1]);
    for (const p of endpoints)
      assert.equal(p.classList.contains('included-endpoint'), simplifiedIncluded, `${graph}: endpoint inclusion`);
  }
});

it('the parity figures plot opposite abscissas with the exact function values', () => {
  for (const graph of ['odd-function', 'non-even-function'] as const) {
    const host = document.createElement('div');
    host.innerHTML = renderPrintSurface({ graph, title: 'Parité', tex: 'f(x)', why: 'Lire les images' });
    const points = [...host.querySelectorAll('.function-point')];
    assert.equal(points.length, 2);
    const xs = points.map((p) => Number(p.getAttribute('data-x')));
    assert.deepEqual(xs, [-1, 1]);
    for (const point of points) {
      const x = Number(point.getAttribute('data-x'));
      const y = Number(point.getAttribute('data-y'));
      const expected = graph === 'odd-function' ? x * Math.exp(x*x) : Math.log(x*x+x+1);
      close(y, expected);
      close(Number(point.getAttribute('cx')), 260 + 105*x);
      close(Number(point.getAttribute('cy')), graph === 'odd-function' ? 200 - 23*expected : 275 - 100*expected);
    }
  }
});

it('both identities hold for every sampled real and no denominator can vanish', () => {
  for (const x of [-30, -10, -1, 0, 1, 10, 30]) {
    const e = Math.exp(x), inverse = Math.exp(-x);
    assert.ok(e > 0 && 1 + e > 0 && 1 + inverse > 0);
    close(e * inverse, 1, 'Exponential of opposite arguments');
    close(e / (1 + e), 1 / (inverse + 1), `3a at ${x}`);
    close((1 - inverse) / (1 + inverse), (e - 1) / (e + 1), `3b at ${x}`);
    // Cross products remove only known nonzero denominators.
    close(e * (inverse + 1), 1 + e, '3a cross product');
    close((1 - inverse) * (e + 1), (e - 1) * (1 + inverse), '3b cross product');
  }
});

it('exercise 4 reduces to e^x=1 and its single solution satisfies the source equation', () => {
  assert.equal(compact(activity('4').result), compact(t`S=\{0\}`));
  assert.ok(hasFormula(activity('4'), t`e^x=1`));
  for (const x of [-4, -1, -0.2, 0, 0.2, 1, 4]) {
    const e = Math.exp(x);
    const difference = e - 2 + 17 * Math.exp(-x) - (e + 3) ** 2 / e;
    // Multiplication by e^x>0 makes the residual exactly 8(1−e^x).
    close(e * difference, 8 * (1 - e), `Equation residual at ${x}`);
    assert.equal(Math.abs(difference) < 1e-10, x === 0);
  }
  close(1 - 2 + 17, (1 + 3) ** 2);
});

it('exercise 5 includes the equality points and both ends of the imposed interval', () => {
  assert.equal(compact(activity('5').result), compact(t`S=[-\pi;-\frac{3\pi}{4}]\cup[-\frac\pi4;\pi]`));
  const threshold = -Math.SQRT1_2;
  const allowed = (x: number) => (-Math.PI <= x && x <= -3 * Math.PI / 4)
    || (-Math.PI / 4 <= x && x <= Math.PI);
  for (let n = 0; n <= 2000; n++) {
    const x = -Math.PI + n * Math.PI / 1000;
    assert.equal(Math.sin(x) >= threshold - 1e-12, allowed(x), `Sine inequality at ${x}`);
  }
  for (const x of [-3 * Math.PI / 4, -Math.PI / 4]) {
    close(Math.sin(x), threshold);
    assert.ok(allowed(x));
  }
  assert.ok(allowed(-Math.PI) && allowed(Math.PI));
  assert.ok(!allowed(-Math.PI / 2));
});

it('exercise 6 filters both periodic families, removes their duplicate and has exactly three roots', () => {
  assert.equal(compact(activity('6').result), compact(t`S=\{-\frac\pi2;\frac\pi6;\frac{5\pi}{6}\}`));
  const candidates: number[] = [];
  for (let k = -5; k <= 5; k++) {
    const branchOne = -Math.PI / 2 + 2 * k * Math.PI;
    const branchTwo = Math.PI / 6 + 2 * k * Math.PI / 3;
    for (const x of [branchOne, branchTwo]) {
      close(Math.sin(x), Math.sin(2 * x + Math.PI / 2), `Periodic candidate k=${k}`);
      if (-Math.PI <= x && x <= Math.PI) candidates.push(x);
    }
  }
  assert.equal(candidates.length, 4, 'One solution appears in both branches');
  const roots = unique(candidates);
  assert.equal(roots.length, 3);
  [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6].forEach((x, i) => close(roots[i], x));
  // Independent reduction to (2 sin x−1)(sin x+1)=0 establishes that
  // the retained values sin x=1/2 or sin x=−1 exhaust all possibilities.
  for (const x of [-Math.PI, -2.3, -1.2, 0, 0.7, 1.8, Math.PI])
    close(Math.sin(x) - Math.sin(2 * x + Math.PI / 2),
      (2 * Math.sin(x) - 1) * (Math.sin(x) + 1));
});

it('exercise 7 respects the angle shift and the half-open interval', () => {
  assert.equal(compact(activity('7').result), compact(t`S=\{\frac{5\pi}{6};\frac{3\pi}{2}\}`));
  for (const x of [-3, -1, 0, 0.25, Math.PI / 2, Math.PI, 5])
    close(Math.sqrt(3) * Math.cos(x) + Math.sin(x), 2 * Math.sin(x + Math.PI / 3), 'Angle-addition identity');
  const roots: number[] = [];
  for (let k = -3; k <= 3; k++) {
    for (const y of [7 * Math.PI / 6 + 2 * k * Math.PI, 11 * Math.PI / 6 + 2 * k * Math.PI]) {
      close(Math.sin(y), -0.5);
      const x = y - Math.PI / 3;
      close(Math.sqrt(3) * Math.cos(x) + Math.sin(x), -1, 'Original equation');
      if (0 <= x && x < 2 * Math.PI) roots.push(x);
    }
  }
  assert.equal(roots.length, 2);
  roots.sort((a, b) => a - b);
  close(roots[0], 5 * Math.PI / 6);
  close(roots[1], 3 * Math.PI / 2);
  assert.ok(Math.sqrt(3) * Math.cos(0) + Math.sin(0) !== -1);
  assert.ok(Math.sqrt(3) * Math.cos(2 * Math.PI) + Math.sin(2 * Math.PI) !== -1);
});

it('trigonometric SVG points lie on their circle and encode the indicated sine values', () => {
  for (const [graph, sine] of [
    ['sine-inequality-arc', -Math.SQRT1_2],
    ['sine-equality', 0.5],
    ['shifted-sine-equation', -0.5],
  ] as const) {
    const host = document.createElement('div');
    host.innerHTML = renderPrintSurface({ graph, title: 'Figure', tex: 'x', why: 'Lecture du cercle' });
    const circle = host.querySelector('.unit-circle');
    assert.ok(circle, `${graph}: a marked unit circle`);
    const cx = Number(circle.getAttribute('cx'));
    const cy = Number(circle.getAttribute('cy'));
    const r = Number(circle.getAttribute('r'));
    assert.ok(r > 0);
    const points = [...host.querySelectorAll('.solution-point')];
    assert.equal(points.length, 2, `${graph}: both intersection points`);
    for (const point of points) {
      const x = (Number(point.getAttribute('cx')) - cx) / r;
      const y = (cy - Number(point.getAttribute('cy'))) / r;
      const angle = Number(point.getAttribute('data-angle-radians'));
      close(x * x + y * y, 1, `${graph}: circle equation`);
      close(y, sine, `${graph}: required ordinate`);
      close(x, Math.cos(angle), `${graph}: cosine of the labelled angle`);
      close(y, Math.sin(angle), `${graph}: sine of the labelled angle`);
      if (graph === 'shifted-sine-equation') {
        const originalAngle = angle - Math.PI / 3;
        close(Math.sqrt(3) * Math.cos(originalAngle) + Math.sin(originalAngle), -1,
          'The plotted auxiliary angle must give a solution of the original equation');
      }
    }
  }
});
