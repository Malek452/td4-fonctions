import { Line, Node } from '@motion-canvas/2d';
import { all, waitFor } from '@motion-canvas/core';
import type { ThreadGenerator } from '@motion-canvas/core';
import { EquationLayer } from './EquationLayer';
import { BLUE, GOLD, SAGE, INK, bounds, center } from './geometry';
import type { Pose } from './geometry';
import type { EquationData } from './equation-data';

export const POWER_SECONDS = 5.2;
export const DISTRIBUTE_SECONDS = 3.9;
const tagged = (poses: Pose[], tag: string) => poses.filter((p) => p.tags.includes(tag));
const without = (poses: Pose[], tags: string[]) =>
  poses.filter((p) => !tags.some((t) => p.tags.includes(t)));
function layer(parent: Node, data: EquationData, poses: Pose[]) {
  const l = new EquationLayer(data.paths);
  parent.add(l.root);
  l.show(poses);
  return l;
}
function underline(parent: Node, poses: Pose[], color: string) {
  const b = bounds(poses);
  const line = new Line({
    points: [
      [b[0] - 2, b[3] + 5],
      [b[2] + 2, b[3] + 5],
    ],
    stroke: color,
    lineWidth: 2,
    end: 0,
  });
  parent.add(line);
  return line;
}
/** The complete exponents have explicit identities. They never borrow a digit
 * from a base, another exponent, a fraction bar or the surrounding expression. */
export function* animatePower(
  parent: Node,
  equation: EquationLayer,
  target: Pose[],
  data: EquationData,
): ThreadGenerator {
  yield* equation.to(
    equation.poses.map((p) => ({ ...p, color: INK })),
    0.25,
    0,
  );
  yield* equation.tint('exponentLeft', GOLD, 0.4);
  yield* equation.tint('exponentRight', BLUE, 0.4);
  const rightLine = underline(parent, tagged(equation.poses, 'exponentRight'), BLUE);
  yield* all(equation.emphasize(0.45, 'exponentLeft'), rightLine.end(1, 0.45));
  yield* waitFor(0.7);
  yield* all(equation.tint('baseLeft', SAGE, 0.4), equation.tint('baseRight', SAGE, 0.4));
  yield* waitFor(0.7);
  rightLine.remove();
  const roles = ['baseLeft', 'baseRight', 'exponentLeft', 'exponentRight'];
  const moving = roles
    .filter((tag) => tagged(equation.poses, tag).length > 0)
    .map((tag) => ({ tag, layer: layer(parent, data, tagged(equation.poses, tag)) }));
  equation.show(without(equation.poses, roles));
  // The operation sign is already readable when the exponents meet. In
  // particular, 2 and 3 must never form the misleading temporary exponent 23.
  const operator = tagged(target, 'operator');
  const sign = layer(parent, data, operator);
  yield* all(
    equation.to(without(target, [...roles, 'operator']), 1.3, 8),
    ...moving.map(({ tag, layer: l }) =>
      l.to(
        tagged(target, tag === 'baseRight' ? 'baseLeft' : tag),
        1.3,
        tag.startsWith('exponent') ? 20 : 8,
      ),
    ),
  );
  // Two identical base outlines meet exactly, then become one retained outline.
  moving.find((m) => m.tag === 'baseRight')?.layer.remove();
  yield* sign.emphasize(0.4, 'operator');
  moving.forEach((m) => m.layer.remove());
  sign.remove();
  equation.show(target);
  yield* equation.emphasize(0.45);
}

/** Split a sum one term at a time. The common factor is copied, never consumed
 * or evaluated; every multiplication is a later, separate teaching step. */
export function* animateDistribution(
  parent: Node,
  equation: EquationLayer,
  target: Pose[],
  data: EquationData,
): ThreadGenerator {
  const sourceFactor = tagged(equation.poses, 'factor'),
    sourceTerm = tagged(equation.poses, 'term'),
    sourceRemaining = tagged(equation.poses, 'remainingTerm');
  const termLine = underline(parent, sourceTerm, BLUE);
  yield* all(equation.emphasize(0.45, 'factor'), termLine.end(1, 0.45));
  const f = center(sourceFactor),
    t = center(sourceTerm);
  const top = Math.min(bounds(sourceFactor)[1], bounds(sourceTerm)[1]) - 28;
  const arrow = new Line({
    points: [
      [f[0], f[1] - 18],
      [f[0], top],
      [t[0], top],
      [t[0], t[1] - 20],
    ],
    radius: 16,
    stroke: GOLD,
    lineWidth: 2,
    endArrow: true,
    arrowSize: 7,
    end: 0,
  });
  parent.add(arrow);
  const remainingCenter = center(sourceRemaining);
  const remainingArrow = sourceRemaining.length
    ? new Line({
        points: [
          [f[0], f[1] - 18],
          [f[0], top - 25],
          [remainingCenter[0], top - 25],
          [remainingCenter[0], bounds(sourceRemaining)[1] - 8],
        ],
        radius: 16,
        stroke: GOLD,
        lineWidth: 2,
        endArrow: true,
        arrowSize: 7,
        end: 0,
      })
    : null;
  if (remainingArrow) parent.add(remainingArrow);
  yield* all(arrow.end(1, 0.7), ...(remainingArrow ? [remainingArrow.end(1, 0.7)] : []));
  yield* waitFor(0.4);
  const original = layer(parent, data, sourceFactor),
    copy = layer(parent, data, sourceFactor),
    term = layer(parent, data, sourceTerm),
    remaining = sourceRemaining.length ? layer(parent, data, sourceRemaining) : null;
  equation.show(without(equation.poses, ['factor', 'term', 'remainingTerm']));
  termLine.remove();
  yield* all(
    copy.to(tagged(target, 'factorCopy'), 1.3, 26),
    original.to(tagged(target, 'factor'), 1.3, 12),
    term.to(tagged(target, 'term'), 1.3, 8),
    ...(remaining ? [remaining.to(tagged(target, 'remainingTerm'), 1.3, 8)] : []),
    equation.to(without(target, ['factorCopy', 'factor', 'term', 'remainingTerm']), 1.3, 8),
  );
  arrow.remove();
  remainingArrow?.remove();
  original.remove();
  copy.remove();
  term.remove();
  remaining?.remove();
  equation.show(target);
  yield* equation.emphasize(0.45);
  yield* waitFor(0.6);
}
