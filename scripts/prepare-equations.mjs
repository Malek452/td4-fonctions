import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createEquationCompiler } from './math-svg.mjs';

await mkdir('.cache', { recursive: true });
await build({
  stdin: {
    contents:
      "export {activities} from './src/content'; export {focusParts} from './src/components/focus'; export {semanticRanges, select} from './motion/semantic-ranges'; export {balancePlan, simplifyPlan} from './motion/operational-plan';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.cache/animation-content.mjs',
});
const {
  activities,
  focusParts,
  semanticRanges,
  select: selection,
  balancePlan,
  simplifyPlan,
} = await import(pathToFileURL(resolve('.cache/animation-content.mjs')).href + '?' + Date.now());
const compiler = createEquationCompiler(),
  prepared = {};
const focusRange = (step) => {
  const p = focusParts(step);
  return { start: p.before.length, end: p.before.length + p.focus.length, tag: 'focus' };
};
for (const activity of activities) {
  prepared[activity.id] = activity.steps.map((step, i) => {
    const previous = activity.steps[i - 1] || step;
    const from = {
      ...previous,
      focus: step.fromFocus || previous.focus,
      focusOccurrence: step.fromFocus ? step.fromFocusOccurrence : previous.focusOccurrence,
    };
    const sourceRanges = [focusRange(from)],
      targetRanges = [focusRange(step)];
    const operation = step.product || step.collect;
    let work, balance, simplify;
    if (step.balance) {
      const plan = balancePlan(previous.tex, step);
      sourceRanges.splice(0, sourceRanges.length, ...plan.source);
      targetRanges.splice(0, targetRanges.length, ...plan.target);
      balance = {
        intermediate: compiler.compile(plan.intermediate.tex, plan.intermediate.ranges),
        operand: compiler.compile(step.balance.operand),
        operation: step.balance.operation,
        reverses: plan.destinationRelation !== step.balance.relation,
        ...(step.balance.condition ? { condition: compiler.compile(step.balance.condition) } : {}),
      };
    }
    if (step.simplify) {
      const plan = simplifyPlan(previous.tex, step);
      sourceRanges.splice(0, sourceRanges.length, ...plan.source);
      targetRanges.splice(0, targetRanges.length, ...plan.target);
      simplify = {
        equality: compiler.compile(plan.equality.tex, plan.equality.ranges),
        rule: step.simplify.rule,
        ...(step.simplify.cancel ? { cancel: true } : {}),
        ...(step.simplify.condition
          ? { condition: compiler.compile(step.simplify.condition) }
          : {}),
      };
    }
    if (step.power || step.distribute) {
      const ranges = semanticRanges(previous.tex, step);
      sourceRanges.splice(0, sourceRanges.length, ...ranges.source);
      targetRanges.splice(0, targetRanges.length, ...ranges.target);
    }
    if (operation) {
      const scope = step.product || step.fromFocus ? sourceRanges[0].start : 0;
      const left = selection(previous.tex, operation.left, 'left', scope);
      const right = selection(previous.tex, operation.right, 'right', left.end);
      if ((step.product || step.fromFocus) && right.end > sourceRanges[0].end)
        throw new Error(`Factor outside its selected expression: ${activity.id}/${i}`);
      sourceRanges.splice(0, 1, left, right);
      // Keep the output sign separate when the source expression contains +x.
      const resultRange = selection(step.tex, operation.result, 'result', targetRanges[0].start);
      targetRanges.splice(0, 1, { ...resultRange, tag: 'focus' }, resultRange);
      const rightTex =
        step.collect && operation.right.startsWith('-')
          ? `\\left(${operation.right}\\right)`
          : operation.right;
      const operator = step.product ? '\\times' : '+';
      const expression = `${operation.left} ${operator} ${rightTex}`;
      work = {
        expression: compiler.compile(expression, [
          selection(expression, operation.left, 'left'),
          selection(expression, rightTex, 'right', operation.left.length),
        ]),
        result: compiler.compile(operation.result),
        ...(step.collect ? { via: compiler.compile(step.collect.via) } : {}),
      };
    }
    return {
      target: compiler.compile(step.tex, targetRanges),
      source: compiler.compile(previous.tex, sourceRanges),
      ...(work ? { work } : {}),
      ...(balance ? { balance } : {}),
      ...(simplify ? { simplify } : {}),
      ...(step.statement ? { statement: true } : {}),
      ...(step.power
        ? { semantic: step.power.kind }
        : step.distribute
          ? { semantic: 'distribute' }
          : {}),
    };
  });
}
await mkdir('motion/generated', { recursive: true });
await writeFile(
  'motion/generated/equations.json',
  JSON.stringify({ paths: compiler.paths, equations: compiler.equations, activities: prepared }),
);
console.log(
  `Prepared ${Object.keys(compiler.equations).length} equations, ${Object.keys(compiler.paths).length} shared glyph outlines, ${activities.length} corrections.`,
);
