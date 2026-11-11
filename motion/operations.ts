import { Line, Node } from '@motion-canvas/2d';
import { all, waitFor } from '@motion-canvas/core';
import type { ThreadGenerator } from '@motion-canvas/core';
import type { EquationData, PreparedStep } from './equation-data';
import type { Pose } from './geometry';
import { BLUE, bounds, center, workingPoses } from './geometry';
import { EquationLayer } from './EquationLayer';

/** Copies start at the actual source factors, and the computed result returns
 * to its actual slot. The full expression remains visible throughout. */
export function* animateOperation(
  parent: Node,
  equation: EquationLayer,
  target: Pose[],
  step: PreparedStep,
  data: EquationData,
): ThreadGenerator {
  const work = step.work!;
  const left = new EquationLayer(data.paths),
    right = new EquationLayer(data.paths),
    calculation = new EquationLayer(data.paths);
  const sourceLeft = equation.poses.filter((g) => g.tags.includes('left')),
    sourceRight = equation.poses.filter((g) => g.tags.includes('right'));
  const resultSlot = target.filter((g) => g.tags.includes('result'));
  const rhs = bounds(sourceRight);
  const rightUnderline = new Line({
    points: [
      [rhs[0] - 2, rhs[3] + 7],
      [rhs[2] + 2, rhs[3] + 7],
    ],
    stroke: BLUE,
    lineWidth: 2,
    end: 0,
  });
  parent.add(rightUnderline);
  yield* all(equation.emphasize(0.55, 'left'), rightUnderline.end(1, 0.55));
  yield* waitFor(0.35);

  left.show(sourceLeft);
  right.show(sourceRight);
  parent.add(left.root);
  parent.add(right.root);
  parent.add(calculation.root);
  const positions = workingPoses(data, work),
    leftTarget = positions.left,
    rightTarget = positions.right;
  const arrows = [
    { from: center(sourceLeft), to: center(leftTarget), color: sourceLeft[0].color },
    { from: center(sourceRight), to: center(rightTarget), color: BLUE },
  ].map(
    ({ from, to, color }) =>
      new Line({
        points: [
          [from[0], from[1] + 16],
          [(from[0] + to[0]) / 2, 65],
          [to[0], to[1] - 25],
        ],
        radius: 18,
        stroke: color,
        lineWidth: 1.5,
        endArrow: true,
        arrowSize: 7,
        end: 0,
      }),
  );
  arrows.forEach((n) => parent.add(n));
  yield* all(
    left.to(leftTarget, 1.05, 16),
    right.to(rightTarget, 1.05, 16),
    ...arrows.map((n) => n.end(1, 1.05)),
  );
  calculation.show(positions.expression);
  left.remove();
  right.remove();
  yield* waitFor(0.45);
  rightUnderline.remove();
  arrows.forEach((n) => n.remove());
  equation.underline.end(0);
  const result = positions.result;
  yield* calculation.rewrite(positions.via || result, 0.85);
  yield* waitFor(0.5);
  if (work.via) yield* calculation.rewrite(result, 0.75);
  // The operands have been used in the calculation. They must not be matched
  // to another occurrence of x or a digit elsewhere in the complete equation.
  const consumed = new EquationLayer(data.paths);
  consumed.show(equation.poses.filter((g) => g.tags.includes('left') || g.tags.includes('right')));
  parent.add(consumed.root);
  equation.show(
    equation.poses.filter((g) => !g.tags.includes('left') && !g.tags.includes('right')),
  );
  yield* all(
    equation.to(
      target.filter((g) => !g.tags.includes('result')),
      1.15,
      12,
      center(resultSlot),
    ),
    calculation.to(resultSlot, 1.15, 24),
    consumed.to([], 1.15, 8, center(resultSlot)),
  );
  consumed.remove();
  calculation.remove();
  equation.show(target);
  yield* equation.emphasize(0.45);
  // Total: 5.35 s for a product, 6.10 s with an intermediate coefficient calculation.
}
