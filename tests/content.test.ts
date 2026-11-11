import { it } from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { activities } from '../src/content';
import { exercises } from './fixtures';
import { definePresentation } from '../src/content/define';
import { readRoute } from '../src/route';
import { focusParts } from '../src/components/focus';
import { expandBinomial } from '../src/content/binomial';
import { quadraticSteps } from '../src/content/quadratic';
import { select } from '../motion/semantic-ranges';

it('semantic selections distinguish variables from letters inside TeX command names', () => {
  const tex = String.raw`t\cdot t`;
  assert.deepEqual(select(tex, 't', 'right', 1), {start: 7, end: 8, tag: 'right'});
  assert.deepEqual(select(String.raw`t \times t`, 't', 'right', 1), {start: 9, end: 10, tag: 'right'});
  assert.equal(select(String.raw`\frac{1}{t}`, String.raw`\frac{1}{t}`, 'factor').start, 0);
  assert.throws(() => select(String.raw`\times`, 't', 'variable'), /Missing/);
});

it('all active lessons contain renderable TeX and exact highlight references', () => {
  for (const activity of activities)
    for (const [i, step] of activity.steps.entries()) {
      katex.renderToString(step.tex, { throwOnError: true, strict: 'error' });
      const parts = focusParts(step);
      assert.equal(parts.before + parts.focus + parts.after, step.tex);
      if (step.fromFocus) {
        const source = focusParts({
          ...activity.steps[i - 1],
          focus: step.fromFocus,
          focusOccurrence: step.fromFocusOccurrence,
        });
        assert.equal(source.focus, step.fromFocus);
      }
    }
});

it('rejects duplicate IDs, ambiguous operations and broken table shapes', () => {
  let deck = structuredClone(exercises);
  deck[1].activities[0].id = deck[0].activities[0].id;
  assert.throws(() => definePresentation(deck), /unique URL-safe/);
  deck = structuredClone(exercises);
  deck[0].activities[0].steps[0].product = { left: 'x', right: 'x', result: 'x^2' };
  assert.throws(() => definePresentation(deck), /source expression/);
  deck = structuredClone(exercises);
  deck[0].activities[0].steps[2].product = { left: 'x', right: 'x', result: 'x^2' };
  assert.throws(() => definePresentation(deck), /one semantic/);
  deck = structuredClone(exercises);
  const frame = deck
    .flatMap((s) => s.activities)
    .flatMap((a) => a.steps)
    .find((s) => s.table)!.table!;
  frame.model.points.reverse();
  assert.throws(() => definePresentation(deck), /strictly increasing/);
  deck = structuredClone(exercises);
  const selection = deck
    .flatMap((s) => s.activities)
    .flatMap((a) => a.steps)
    .find((s) => s.table?.selectedPoints)!.table!;
  selection.selectedPoints = [0];
  assert.throws(() => definePresentation(deck), /forbidden endpoint/);
});

it('stable activity links survive section reordering and unknown links fall back', () => {
  const route = readRoute(exercises, '#activity/distributivity');
  assert.equal(
    exercises.find((s) => s.id === route.exercise)!.activities[route.index].id,
    'distributivity',
  );
  assert.deepEqual(readRoute([...exercises].reverse(), '#activity/distributivity'), route);
  assert.deepEqual(readRoute(exercises, '#activity/unknown'), {
    exercise: exercises[0].id,
    index: 0,
  });
  assert.deepEqual(readRoute(exercises, '#activity/%E0%A4%A'), {
    exercise: exercises[0].id,
    index: 0,
  });
});

it('restricted authoring helpers reject unsupported cases instead of silently producing invalid slides', () => {
  assert.throws(() => expandBinomial((x) => x, 2, 3), /supports/);
  assert.throws(() => expandBinomial((x) => x, 2, -2), /supports/);
  assert.throws(() => quadraticSteps({ a: 0, b: 1, c: 1, roots: ['0', '1'] }), /requires/);
  assert.throws(() => quadraticSteps({ a: 1, b: 0, c: 1, roots: ['0', '1'] }), /requires/);
});
