import { it } from 'node:test';
import assert from 'node:assert/strict';
// Independent symbolic checks are test-only. The student UI has no answer validator.
// @ts-expect-error Nerdamer does not ship declarations for this entry.
import nerdamer from 'nerdamer/all.js';
import { getActivity } from './fixtures';

// Nerdamer needs command separators and explicit fraction groups, even though
// MathJax and KaTeX also accept the shorter equivalent notation.
const parse = (tex: string) =>
  nerdamer.convertFromLaTeX(
    tex
      .replaceAll('\\times', '\\times ')
      .replaceAll('\\cdot', '\\cdot ')
      .replace(/\\(?:tfrac|frac)(\d)(\d)/g, '\\frac{$1}{$2}'),
  );
const numeric = (tex: string) => Number(parse(tex).evaluate().text('decimals'));
it('each power step preserves the original value, including nested powers', () => {
  const expected: Record<string, number> = { '1q1': 100000, '1q2': 7 ** 1.5, '1q4': 64 };
  for (const [id, value] of Object.entries(expected)) {
    const a = getActivity(id)!;
    for (const s of a.steps)
      for (const member of s.tex.split('='))
        assert.ok(
          Math.abs(numeric(member) - value) < Math.max(1, value) * 1e-10,
          `${id}: ${member}`,
        );
  }
});
it('every distributivity step is exactly the same polynomial', () => {
  const a = getActivity('distributivity')!;
  for (const s of a.steps)
    for (const member of s.tex.split('=')) {
      const difference = nerdamer(`expand((${parse(member).text()})-(x^2+x-2))`).toString();
      assert.equal(difference, '0', member);
    }
});
it('the two quadratic roots satisfy the original equation and both signs appear in the formula', () => {
  const a = getActivity('quadratic')!;
  const finalRoots = a.steps
    .filter((s) => s.title === 'Simplifier la fraction')
    .map((s) => numeric(s.tex.split('=')[1]));
  assert.deepEqual(finalRoots, [-2.5, 1]);
  for (const x of finalRoots) assert.equal(2 * x * x + 3 * x - 5, 0);
  assert.ok(a.steps.some((s) => s.statement && s.tex.includes('-b-\\sqrt{\\Delta}')));
  assert.ok(a.steps.some((s) => s.statement && s.tex.includes('-b+\\sqrt{\\Delta}')));
});
it('the sign table agrees with the rational function and excludes its pole', () => {
  const s = getActivity('sign-table')!.steps.find((s) => s.table?.selectedIntervals)!.table!;
  const f = (x: number) => (x - 1) / (x + 2);
  for (const [i, x] of [-3, 0, 2].entries()) {
    assert.equal(s.model.rows.at(-1)!.intervals[i], f(x) > 0 ? '+' : '-');
    assert.equal(s.selectedIntervals!.includes(i), f(x) >= 0);
  }
  assert.equal(s.model.rows.at(-1)!.points[0], 'bar');
  assert.deepEqual(s.selectedPoints, [1]);
  assert.equal(f(1), 0);
});
it('both unit-circle diagrams solve sin(x)=1/2, including complete turns', () => {
  const steps = getActivity('circle-sine')!.steps.filter((s) => s.circle);
  assert.equal(steps.length, 2);
  for (const s of steps)
    for (const k of [-2, -1, 0, 1, 2])
      assert.ok(Math.abs(Math.sin(s.circle!.angle + 2 * k * Math.PI) - 0.5) < 1e-12);
});
