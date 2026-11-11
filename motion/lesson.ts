import { makeScene2D, Latex, Line, Rect, Txt, Circle } from '@motion-canvas/2d';
import { all, createSignal, useScene, waitFor } from '@motion-canvas/core';
import type { Activity, Step } from '../src/types';
import type { EquationData } from './equation-data';
import compiled from './generated/equations.json';
import { EquationLayer } from './EquationLayer';
import { activityLayouts, BLUE as blue, GOLD as gold, INK as ink, sourcePoses } from './geometry';
import { animateOperation } from './operations';
import { animatePower, animateDistribution } from './semantic-operations';
import { animateBalance, animateSimplify } from './operational-animations';
import { finishStep } from './step-clock';
import { motionTex } from './tex';
import { theme } from '../src/theme';
import { ui } from '../src/ui';
const equations = compiled as unknown as EquationData;
export default makeScene2D(function* (view) {
  const data = useScene().variables.get<Activity>('activity', null as unknown as Activity)();
  if (!data) {
    yield* waitFor(1);
    return;
  }
  view.fill(theme.board);
  const steps = equations.activities[data.id];
  const layouts = activityLayouts(equations, steps);
  const formula = new EquationLayer(equations.paths);
  view.add(formula.root);
  formula.show(layouts[0]);
  // Diagrams are mounted only for their dedicated explanatory step, not alongside every formula.
  const diagramNodes: (Rect | Line | Txt | Circle | Latex)[] = [];
  const angle = createSignal(0);
  let circleAnswer: Latex | null = null,
    circleInstruction: Txt | null = null;
  function revealCircleAnswer() {
    circleInstruction?.opacity(0);
    circleAnswer?.opacity(1);
  }
  function setDiagram(step: Step, previous?: Step): Rect | null {
    let flap: Rect | null = null;
    circleAnswer = null;
    circleInstruction = null;
    diagramNodes.forEach((n) => n.remove());
    diagramNodes.length = 0;
    formula.root.opacity(step.diagram || step.circle || step.prose || step.graph ? 0 : 1);
    if (step.diagram === 'fold') {
      diagramNodes.push(
        new Rect({
          width: 360,
          height: 255,
          x: 0,
          y: -10,
          stroke: blue,
          lineWidth: 3,
          lineDash: [6, 6],
        }),
        new Rect({
          width: 180,
          height: 255,
          x: -90,
          y: -10,
          fill: theme.panel,
          stroke: blue,
          lineWidth: 2,
        }),
        new Line({
          points: [
            [0, -137],
            [0, 117],
          ],
          stroke: gold,
          lineWidth: 3,
          lineDash: [7, 7],
        }),
        new Txt({ text: ui.fold, y: 153, fill: gold, fontSize: 22 }),
        new Txt({ text: 'a', x: -212, fill: blue, fontSize: 26 }),
        new Txt({ text: 'b / 2', x: -90, y: -164, fill: gold, fontSize: 23 }),
        new Txt({ text: 'b / 2', x: 90, y: -164, fill: gold, fontSize: 23 }),
      );
    } else if (step.circle) {
      const cx = -190,
        R = 118;
      const point = () => [cx + R * Math.cos(angle()), -R * Math.sin(angle())] as [number, number];
      const isCos = step.circle.axis === 'cos';
      const projection = () =>
        isCos ? ([point()[0], 0] as [number, number]) : ([cx, point()[1]] as [number, number]);
      const color = isCos ? gold : blue;
      const annotation = new Latex({
        tex: motionTex(step.tex),
        fill: color,
        fontSize: 38,
        x: 230,
        y: 0,
        opacity: 0,
      });
      circleAnswer = annotation;
      circleInstruction = new Txt({
        text: ui.radius,
        x: 220,
        y: 0,
        fill: ink,
        fontSize: 25,
      });
      annotation.scale(() => Math.min(1, 370 / Math.max(1, annotation.width())));
      const targetCoordinate = isCos
        ? cx + R * Math.cos(step.circle.angle)
        : -R * Math.sin(step.circle.angle);
      diagramNodes.push(
        new Circle({ x: cx, size: R * 2, stroke: theme.muted, lineWidth: 2 }),
        new Line({
          points: [
            [cx - 150, 0],
            [cx + 150, 0],
          ],
          stroke: theme.muted,
          lineWidth: 1,
          endArrow: true,
        }),
        new Line({
          points: [
            [cx, 145],
            [cx, -145],
          ],
          stroke: theme.muted,
          lineWidth: 1,
          endArrow: true,
        }),
        new Line({ points: () => [[cx, 0], point()], stroke: ink, lineWidth: 2 }),
        new Line({
          points: isCos
            ? [
                [targetCoordinate, -R],
                [targetCoordinate, R],
              ]
            : [
                [cx - R, targetCoordinate],
                [cx + R, targetCoordinate],
              ],
          stroke: color,
          lineWidth: 1.5,
          lineDash: [3, 6],
        }),
        new Line({
          points: () => [point(), projection()],
          stroke: color,
          lineWidth: 2,
          lineDash: [5, 5],
        }),
        new Line({ points: () => [[cx, 0], projection()], stroke: color, lineWidth: 5 }),
        new Circle({ position: point, size: 12, fill: color }),
        new Txt({ text: '1', x: cx + 132, y: 24, fill: ink, fontSize: 19 }),
        new Txt({ text: '−1', x: cx - 136, y: 24, fill: ink, fontSize: 19 }),
        new Txt({ text: '1', x: cx + 18, y: -131, fill: ink, fontSize: 19 }),
        new Txt({ text: '−1', x: cx + 22, y: 137, fill: ink, fontSize: 19 }),
        annotation,
        circleInstruction,
        new Txt({
          text: isCos ? ui.horizontal : ui.vertical,
          x: 220,
          y: 80,
          fill: ink,
          fontSize: 19,
        }),
      );
      if (previous?.circle)
        diagramNodes.push(
          new Circle({
            position: [
              cx + R * Math.cos(previous.circle.angle),
              -R * Math.sin(previous.circle.angle),
            ],
            size: 14,
            stroke: color,
            lineWidth: 2,
            fill: theme.board,
          }),
        );
    }
    diagramNodes.forEach((n) => view.add(n));
    if (step.diagram === 'fold') {
      flap = new Rect({
        width: 180,
        height: 255,
        x: 90,
        y: -10,
        fill: theme.controls,
        stroke: gold,
        lineWidth: 2,
      });
      diagramNodes.push(flap);
      view.add(flap);
    }
    return flap;
  }
  setDiagram(data.steps[0]);
  yield* formula.emphasize(0.6);
  yield* finishStep(0);
  for (let i = 1; i < data.steps.length; i++) {
    const s = data.steps[i],
      previous = data.steps[i - 1];
    angle(previous.circle?.angle || 0);
    const flap = setDiagram(s, previous);
    if (s.diagram || s.circle) {
      if (flap) {
        yield* waitFor(0.7);
        yield* all(flap.x(-90, 2), flap.scale.x(-1, 2));
      } else if (s.circle) {
        yield* waitFor(0.7);
        yield* angle(s.circle.angle, 2);
        // The displayed exact value describes the reached point, never an
        // intermediate moving coordinate. The first solution stays marked.
        revealCircleAnswer();
      }
      yield* finishStep(i);
      continue;
    }
    const source = sourcePoses(layouts[i - 1], equations.equations[steps[i].source]);
    const target = layouts[i];
    if (previous.table || previous.diagram || previous.circle || previous.prose || previous.graph)
      formula.show(target);
    else yield* formula.to(source, 0.25, 0);
    if (s.table || s.prose || s.graph) {
      // The accessible HTML table occupies this same surface in the reader.
      // Keep editor/export timeline slots deterministic without morphing tables.
      formula.show(target);
    } else if (steps[i].balance) {
      yield* animateBalance(view, formula, target, steps[i], equations);
    } else if (steps[i].simplify) {
      yield* animateSimplify(view, formula, target, steps[i], equations);
    } else if (steps[i].semantic) {
      const distribution = steps[i].semantic === 'distribute';
      if (distribution) yield* animateDistribution(view, formula, target, equations);
      else yield* animatePower(view, formula, target, equations);
    } else if (steps[i].work) {
      yield* animateOperation(view, formula, target, steps[i], equations);
    } else if (
      previous.table ||
      previous.diagram ||
      previous.circle ||
      previous.prose ||
      previous.graph
    ) {
      yield* formula.emphasize(0.7);
    } else if (steps[i].statement) {
      // A different statement changes the board smoothly as a whole. It is
      // never confused with a local algebraic calculation.
      yield* formula.introduce(target);
      yield* formula.emphasize(0.7);
    } else {
      yield* formula.emphasize(0.6);
      yield* waitFor(0.45);
      yield* formula.rewrite(target, 1.65);
      yield* formula.emphasize(0.5);
    }
    yield* finishStep(i);
  }
  yield* waitFor(0.1);
});
