import { Line, Node, Txt } from '@motion-canvas/2d';
import { all, waitFor } from '@motion-canvas/core';
import type { ThreadGenerator } from '@motion-canvas/core';
import { EquationLayer } from './EquationLayer';
import type { EquationData, PreparedStep } from './equation-data';
import {
  BLUE,
  GOLD,
  INK,
  SAGE,
  bounds,
  center,
  balancePoses,
  simplifyPoses,
  type Pose,
} from './geometry';

// Bounded durations are documented in timing.ts; absolute step boundaries remain unchanged.
const tagged = (poses: Pose[], tag: string) => poses.filter((p) => p.tags.includes(tag));
const without = (poses: Pose[], tags: string[]) =>
  poses.filter((p) => !tags.some((tag) => p.tags.includes(tag)));
function layer(parent: Node, data: EquationData, poses: Pose[]) {
  const result = new EquationLayer(data.paths);
  parent.add(result.root);
  result.show(poses);
  return result;
}
function line(parent: Node, poses: Pose[], color: string) {
  const b = bounds(poses);
  const result = new Line({
    points: [
      [b[0], b[3] + 7],
      [b[2], b[3] + 7],
    ],
    stroke: color,
    lineWidth: 3,
    end: 0,
  });
  parent.add(result);
  return result;
}
function heading(parent: Node, text: string) {
  const result = new Txt({ text, y: -174, fontSize: 25, fontFamily: 'Arial', fill: INK });
  result.scale(() => Math.min(1, 900 / Math.max(1, result.width())));
  parent.add(result);
  return result;
}
function condition(parent: Node, data: EquationData, poses: Pose[]) {
  return poses.length ? layer(parent, data, poses) : null;
}
function arrow(parent: Node, from: [number, number], to: [number, number], color: string) {
  const result = new Line({
    points: [from, to],
    stroke: color,
    lineWidth: 2.5,
    endArrow: true,
    arrowSize: 9,
    end: 0,
  });
  parent.add(result);
  return result;
}

/** The same authored operand is copied into both members. Original members keep
 * their identities, including signs and brackets. A negative multiplier/divisor
 * reverses the relation before the intermediate is shown, never afterward. */
export function* animateBalance(
  parent: Node,
  equation: EquationLayer,
  target: Pose[],
  step: PreparedStep,
  data: EquationData,
): ThreadGenerator {
  const work = step.balance!;
  const positions = balancePoses(data, step);
  const title = heading(
    parent,
    {
      add: 'Ajouter la même quantité aux deux membres',
      subtract: 'Soustraire la même quantité aux deux membres',
      multiply: 'Multiplier les deux membres par le même facteur non nul',
      divide: 'Diviser les deux membres par le même nombre non nul',
    }[work.operation],
  );
  const hypothesis = condition(parent, data, positions.condition);
  yield* equation.to(positions.source, 0.35, 0);
  const left = tagged(equation.poses, 'memberLeft'),
    right = tagged(equation.poses, 'memberRight');
  const leftLine = line(parent, left, GOLD),
    rightLine = line(parent, right, BLUE);
  yield* all(leftLine.end(1, 0.45), rightLine.end(1, 0.45));
  yield* waitFor(0.35);
  const intermediate = positions.intermediate;
  const leftMember = layer(parent, data, left),
    rightMember = layer(parent, data, right);
  // One visible quantity is cloned into the two authored operand slots.
  const operand = positions.operand;
  const firstCopy = layer(parent, data, operand),
    secondCopy = layer(parent, data, operand);
  equation.show(without(equation.poses, ['memberLeft', 'memberRight']));
  const scaffold = without(intermediate, [
    'memberLeft',
    'memberRight',
    'operandLeft',
    'operandRight',
  ]);
  leftLine.remove();
  rightLine.remove();
  yield* all(
    leftMember.to(tagged(intermediate, 'memberLeft'), 1.2, 0),
    rightMember.to(tagged(intermediate, 'memberRight'), 1.2, 0),
    firstCopy.to(tagged(intermediate, 'operandLeft'), 1.2, 18),
    secondCopy.to(tagged(intermediate, 'operandRight'), 1.2, 18),
    equation.to(scaffold, 1.2, 0),
  );
  leftMember.remove();
  rightMember.remove();
  firstCopy.remove();
  secondCopy.remove();
  equation.show(intermediate);
  const operationLeft = line(parent, tagged(intermediate, 'operandLeft'), GOLD);
  const operationRight = line(parent, tagged(intermediate, 'operandRight'), BLUE);
  yield* all(operationLeft.end(1, 0.4), operationRight.end(1, 0.4));
  title.text(
    work.reverses
      ? 'Nombre strictement négatif : sens de l’inégalité inversé'
      : 'Même opération appliquée aux deux membres',
  );
  yield* waitFor(1.05);
  operationLeft.remove();
  operationRight.remove();
  title.text('Simplifier chacun des deux membres');
  // The resulting members are introduced as complete mathematical expressions,
  // not arbitrary digit morphs. Their arrows identify exactly what is reduced.
  const output = positions.output;
  const result = layer(parent, data, output);
  const arrows = ['Left', 'Right'].map((side, i) => {
    const from = bounds(tagged(intermediate, `side${side}`));
    const to = bounds(tagged(output, `member${side}`));
    return arrow(
      parent,
      [(from[0] + from[2]) / 2, Math.min(45, from[3] + 8)],
      [(to[0] + to[2]) / 2, to[1] - 7],
      i ? BLUE : GOLD,
    );
  });
  yield* all(...arrows.map((a) => a.end(1, 0.45)));
  yield* waitFor(0.9);
  arrows.forEach((a) => a.remove());
  // Swap the whole reduced expressions into place; surrounding context never
  // supplies a matching digit to an unrelated calculation.
  equation.show([]);
  yield* result.to(target, 1.1, 0);
  result.remove();
  equation.show(target);
  title.remove();
  hypothesis?.remove();
  yield* equation.emphasize(0.5);
}

/** A visible equality and named rule justify a local replacement. Only a copy
 * of the selected source leaves the board; the rest stays readable throughout. */
export function* animateSimplify(
  parent: Node,
  equation: EquationLayer,
  target: Pose[],
  step: PreparedStep,
  data: EquationData,
): ThreadGenerator {
  const work = step.simplify!;
  const positions = simplifyPoses(data, step);
  const title = heading(parent, work.rule);
  const hypothesis = condition(parent, data, positions.condition);
  yield* equation.to(positions.source, 0.35, 0);
  yield* equation.emphasize(0.45, 'replacement');
  yield* waitFor(0.35);
  const equality = positions.equality;
  const selected = tagged(equation.poses, 'replacement');
  const moving = layer(parent, data, selected);
  const a = center(selected),
    b = center(tagged(equality, 'replacement'));
  const guide = arrow(
    parent,
    [a[0], bounds(selected)[3] + 10],
    [b[0], bounds(tagged(equality, 'replacement'))[1] - 8],
    GOLD,
  );
  yield* all(moving.to(tagged(equality, 'replacement'), 0.95, 0), guide.end(1, 0.95));
  const calculation = layer(parent, data, equality);
  moving.remove();
  guide.remove();
  const cancellation = work.cancel
    ? ['cancelFactor', 'cancelDenominator'].map((tag) => {
        const box = bounds(tagged(equality, tag));
        const stroke = new Line({
          points: [
            [box[0] - 4, box[3] + 3],
            [box[2] + 4, box[1] - 3],
          ],
          stroke: SAGE,
          lineWidth: 3,
          end: 0,
        });
        parent.add(stroke);
        return stroke;
      })
    : [];
  // Both marks identify the same nonzero multiplicative factor, never terms
  // separated by + or −. The restricted compiler validates this structure.
  if (cancellation.length) yield* all(...cancellation.map((stroke) => stroke.end(1, 0.5)));
  yield* calculation.emphasize(0.4, 'result');
  yield* waitFor(cancellation.length ? 0.65 : 1.15);
  const result = layer(parent, data, tagged(equality, 'result'));
  // Preserve the unchanged prefix and suffix as their own group. The result
  // alone travels from the proved equality to the exact replacement slot.
  equation.show(without(equation.poses, ['replacement']));
  cancellation.forEach((stroke) => stroke.remove());
  calculation.remove();
  yield* all(
    equation.to(without(target, ['result']), 1.2, 0),
    result.to(tagged(target, 'result'), 1.2, 0),
  );
  result.remove();
  equation.show(target);
  title.remove();
  hypothesis?.remove();
  yield* equation.emphasize(0.5);
  yield* waitFor(0.6);
}
