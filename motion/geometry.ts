import type { Equation, EquationData, Glyph, PreparedStep } from './equation-data';
import { theme } from '../src/theme';

export interface Pose extends Glyph {
  color: string;
}
export const INK = theme.mathInk,
  GOLD = theme.active,
  BLUE = theme.second,
  SAGE = theme.base;
export const colorFor = (g: Glyph) =>
  g.tags.some((t) =>
    ['right', 'exponentRight', 'term', 'remainingTerm', 'memberRight', 'operandRight'].includes(t),
  )
    ? BLUE
    : g.tags.some((t) => ['baseLeft', 'baseRight'].includes(t))
      ? SAGE
      : g.tags.some((t) =>
            [
              'focus',
              'left',
              'result',
              'exponentLeft',
              'factor',
              'factorCopy',
              'memberLeft',
              'operandLeft',
              'replacement',
            ].includes(t),
          )
        ? GOLD
        : INK;
export function bounds(poses: Glyph[]): [number, number, number, number] {
  if (!poses.length) return [0, 0, 0, 0];
  return [
    Math.min(...poses.map((g) => g.bounds[0])),
    Math.min(...poses.map((g) => g.bounds[1])),
    Math.max(...poses.map((g) => g.bounds[2])),
    Math.max(...poses.map((g) => g.bounds[3])),
  ];
}
export function center(poses: Glyph[]): [number, number] {
  const b = bounds(poses);
  return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
}
export function shift(poses: Pose[], dx: number, dy = 0): Pose[] {
  return poses.map((g) => ({
    ...g,
    x: g.x + dx,
    y: g.y + dy,
    bounds: [g.bounds[0] + dx, g.bounds[1] + dy, g.bounds[2] + dx, g.bounds[3] + dy],
  }));
}
export function place(
  eq: Equation,
  x = 0,
  y = 0,
  maxWidth = 880,
  maxHeight = 240,
  color?: string,
): Pose[] {
  const scale = Math.min(1, maxWidth / eq.width, maxHeight / eq.height);
  return eq.glyphs.map((g) => ({
    ...g,
    x: g.x * scale + x,
    y: g.y * scale + y,
    sx: g.sx * scale,
    sy: g.sy * scale,
    color: color || colorFor(g),
    bounds: [
      g.bounds[0] * scale + x,
      g.bounds[1] * scale + y,
      g.bounds[2] * scale + x,
      g.bounds[3] * scale + y,
    ],
  }));
}
/** Only the identical beginning/end of a rewrite is retained automatically.
 * The changed middle is one mathematical replacement, never a bag of glyphs.
 * Explicit factor/exponent layers contain their complete, authored identity. */
export function contextPairs(from: Glyph[], to: Glyph[]): [number, number][] {
  const pairs: [number, number][] = [];
  let first = 0;
  while (first < Math.min(from.length, to.length) && from[first].path === to[first].path) {
    pairs.push([first, first]);
    first++;
  }
  let i = from.length - 1,
    j = to.length - 1;
  const tail: [number, number][] = [];
  while (i >= first && j >= first && from[i].path === to[j].path) tail.push([i--, j--]);
  return [...pairs, ...tail.reverse()];
}
/** Align on a retained glyph when space allows, so a base or left member stays put. */
export function align(from: Pose[], to: Pose[]): Pose[] {
  const matches = contextPairs(from, to);
  const anchor =
    matches.find(([i, j]) => !from[i].tags.includes('focus') && !to[j].tags.includes('focus')) ||
    matches.find(
      ([i]) =>
        /^[0-9A-F]+$/.test(from[i].symbol) &&
        !['2B', '2212', '3D', '28', '29'].includes(from[i].symbol),
    );
  if (!anchor) return to;
  const [i, j] = anchor,
    b = bounds(to);
  const dx = Math.max(-440 - b[0], Math.min(440 - b[2], from[i].x - to[j].x));
  const dy = Math.max(-115 - b[1], Math.min(115 - b[3], from[i].y - to[j].y));
  return shift(to, dx, dy);
}
export function activityLayouts(data: EquationData, steps: PreparedStep[]): Pose[][] {
  const result: Pose[][] = [];
  let previous: PreparedStep | undefined;
  for (const step of steps) {
    const poses = place(data.equations[step.target]);
    const unchanged =
      previous && data.equations[previous.target].tex === data.equations[step.target].tex;
    result.push(
      result.length && (!step.statement || unchanged)
        ? align(result[result.length - 1], poses)
        : poses,
    );
    previous = step;
  }
  return result;
}
/** Selection tags can change while the preceding expression stays exactly still. */
export function sourcePoses(previous: Pose[], source: Equation): Pose[] {
  if (
    previous.length !== source.glyphs.length ||
    previous.some((g, i) => g.path !== source.glyphs[i].path)
  )
    throw new Error('A highlight changed the mathematical glyph sequence: ' + source.tex);
  return previous.map((g, i) => ({
    ...g,
    tags: source.glyphs[i].tags,
    color: colorFor(source.glyphs[i]),
  }));
}
export function arcPoint(
  from: [number, number],
  to: [number, number],
  t: number,
  lift = 24,
): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t - Math.sin(Math.PI * t) * lift,
  ];
}
export function workingPoses(data: EquationData, work: NonNullable<PreparedStep['work']>) {
  const expression = place(data.equations[work.expression], 0, 105, 650, 80);
  return {
    expression,
    left: expression.filter((g) => g.tags.includes('left')),
    right: expression.filter((g) => g.tags.includes('right')),
    result: place(data.equations[work.result], 0, 105, 650, 80, GOLD),
    via: work.via ? place(data.equations[work.via], 0, 105, 650, 80, GOLD) : undefined,
  };
}

/** Distinct working regions leave a gap between calculation and hypothesis. */
export function balancePoses(data: EquationData, step: PreparedStep) {
  const work = step.balance!;
  return {
    source: place(data.equations[step.source], 0, 0, 880, 120),
    intermediate: place(data.equations[work.intermediate], 0, -30, 880, 140),
    operand: place(data.equations[work.operand], 0, -118, 260, 40, GOLD),
    output: place(data.equations[step.target], 0, 99, 880, 64),
    condition: work.condition ? place(data.equations[work.condition], 0, 166, 840, 36, SAGE) : [],
  };
}
export function simplifyPoses(data: EquationData, step: PreparedStep) {
  const work = step.simplify!;
  return {
    source: place(data.equations[step.source], 0, -44, 880, 115),
    equality: place(data.equations[work.equality], 0, 94, 800, 70),
    condition: work.condition ? place(data.equations[work.condition], 0, 166, 840, 36, SAGE) : [],
  };
}
