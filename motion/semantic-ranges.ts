import type { Step } from '../src/types';
export interface Range {
  start: number;
  end: number;
  tag: string;
}
export function select(tex: string, text: string, tag: string, from = 0): Range {
  // A variable such as t must never select the t inside \\times or \\cdot.
  // Whole TeX commands remain valid selections, including their arguments.
  const commands = [...tex.matchAll(/\\[a-zA-Z]+/g)].map((m) => [m.index!, m.index! + m[0].length]);
  let start = text ? tex.indexOf(text, from) : -1;
  while (start >= 0) {
    const end = start + text.length;
    if (!commands.some(([a, b]) => (start > a && start < b) || (end > a && end < b)))
      return { start, end, tag };
    start = tex.indexOf(text, start + 1);
  }
  throw new Error(`Missing ${tag}: ${text} in ${tex}`);
}
/** Roles are declared by the author. A base cannot be confused with a digit
 * in an exponent, and each complete exponent travels as a single group. */
export function semanticRanges(previous: string, step: Step) {
  const source: Range[] = [],
    target: Range[] = [];
  if (!step.fromFocus) throw new Error('A semantic animation requires fromFocus.');
  let scope = select(previous, step.fromFocus, 'scope');
  for (let n = 1; n < (step.fromFocusOccurrence || 1); n++)
    scope = select(previous, step.fromFocus, 'scope', scope.start + 1);
  const addSource = (text: string, tag: string, from: number) => {
    const r = select(previous, text, tag, from);
    if (r.end > scope.end) throw new Error(`Selection escapes fromFocus: ${tag}`);
    source.push(r);
    return r;
  };
  if (step.power) {
    const p = step.power;
    const b1 = addSource(p.base + '^', 'baseLeft', scope.start);
    b1.end--; // exclude the superscript operator from the base
    const left = addSource(p.left, 'exponentLeft', b1.end + 1);
    let next = left.end;
    if (p.kind !== 'power') {
      const b2 = addSource(p.base + '^', 'baseRight', next);
      b2.end--;
      next = b2.end + 1;
    } else {
      const caret = previous.indexOf('^', next);
      if (caret < 0 || caret >= scope.end) throw new Error('Missing outer exponent');
      next = caret + 1;
    }
    addSource(p.right, 'exponentRight', next);
    const out = select(step.tex, p.to, 'scope');
    const base = select(step.tex, p.base + '^', 'baseLeft', out.start);
    base.end--;
    const l = select(step.tex, p.targetLeft || p.left, 'exponentLeft', base.end + 1);
    const operator = select(
      step.tex,
      p.kind === 'product' ? '+' : p.kind === 'quotient' ? '-' : '\\times',
      'operator',
      l.end,
    );
    const r = select(step.tex, p.targetRight || p.right, 'exponentRight', operator.end);
    if (r.end > out.end) throw new Error('Power result escapes its destination');
    target.push(base, l, operator, r, { start: l.start, end: r.end, tag: 'focus' });
  } else if (step.distribute) {
    const d = step.distribute;
    const factor = addSource(d.factor, 'factor', scope.start);
    const sourceTerm = addSource(d.term, 'term', d.side === 'right' ? scope.start : factor.end);
    if (d.side === 'right' && sourceTerm.end > factor.start)
      throw new Error('Right-distributed factor overlaps its selected term');
    const product = select(step.tex, d.product, 'product');
    const copy = select(step.tex, d.factor, 'factorCopy', product.start);
    const term = select(step.tex, d.term, 'term', d.side === 'right' ? product.start : copy.end);
    if (term.end > product.end) throw new Error('Distributed term outside its product');
    const remainder = select(step.tex, d.remainder, 'remainder', product.end);
    const retained = select(step.tex, d.factor, 'factor', remainder.start);
    if (retained.end > remainder.end) throw new Error('Retained factor outside its remainder');
    target.push(copy, term, retained, { ...product, tag: 'focus' });
    if (d.remainingTerm) {
      const remaining = addSource(d.remainingTerm, 'remainingTerm', sourceTerm.end);
      const retainedTerm = select(step.tex, d.remainingTerm, 'remainingTerm', remainder.start);
      if (retainedTerm.end > remainder.end)
        throw new Error('Remaining terms outside their remainder');
      if (remaining.end > scope.end) throw new Error('Remaining terms outside source');
      target.push(retainedTerm);
    }
  } else throw new Error('No semantic operation');
  return { source, target };
}
