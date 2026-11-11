import type { Step } from '../src/types';
import { select, type Range } from './semantic-ranges';

/** Exact author roles; no matching of unrelated digits or command letters. */
function occurrence(tex: string, text: string, tag: string, count = 1): Range {
  let range = select(tex, text, tag);
  for (let n = 1; n < count; n++) range = select(tex, text, tag, range.start + 1);
  return range;
}
function inside(tex: string, text: string, tag: string, scope: Range, from = scope.start) {
  const range = select(tex, text, tag, from);
  if (range.end > scope.end) throw new Error(`Selection escapes its operation: ${tag}`);
  return range;
}
export function reversedRelation(relation: NonNullable<Step['balance']>['relation']) {
  const relations: Record<string, string> = {
    '=': '=',
    '<': '>',
    '>': '<',
    '\\le': '\\ge',
    '\\ge': '\\le',
    '\\leq': '\\geq',
    '\\geq': '\\leq',
  };
  if (!(relation in relations)) throw new Error('Unsupported balance relation.');
  return relations[relation];
}
function sourceScope(previous: string, step: Step) {
  if (!step.fromFocus) throw new Error('An operational animation requires fromFocus.');
  return occurrence(previous, step.fromFocus, 'focus', step.fromFocusOccurrence);
}
function targetScope(step: Step) {
  return step.focus
    ? occurrence(step.tex, step.focus, 'focus', step.focusOccurrence)
    : { start: 0, end: step.tex.length, tag: 'focus' };
}
export function balancePlan(previous: string, step: Step) {
  const b = step.balance;
  if (!b) throw new Error('No balance operation.');
  const scope = sourceScope(previous, step);
  const left = inside(previous, b.left, 'memberLeft', scope);
  const relation = inside(previous, b.relation, 'relation', scope, left.end);
  const right = inside(previous, b.right, 'memberRight', scope, relation.end);
  const reverse = ['multiply', 'divide'].includes(b.operation) && b.sign === 'negative';
  const destinationRelation = reverse ? reversedRelation(b.relation) : b.relation;
  const out = targetScope(step);
  const toLeft = inside(step.tex, b.toLeft, 'memberLeft', out);
  const toRelation = inside(step.tex, destinationRelation, 'relation', out, toLeft.end);
  const toRight = inside(step.tex, b.toRight, 'memberRight', out, toRelation.end);
  const sourceContext = previous.slice(0, left.start) + previous.slice(right.end);
  const targetContext = step.tex.slice(0, toLeft.start) + step.tex.slice(toRight.end);
  if (sourceContext.replace(/\s/g, '') !== targetContext.replace(/\s/g, ''))
    throw new Error('An operation on both members must preserve the surrounding expression.');
  const member = (value: string, side: 'Left' | 'Right') => {
    const start = b.operation === 'divide' ? '\\frac{' : '\\left(';
    const middle =
      b.operation === 'divide'
        ? '}{'
        : `\\right)${{ add: '+', subtract: '-', multiply: '\\times' }[b.operation]}\\left(`;
    const end = b.operation === 'divide' ? '}' : '\\right)';
    const tex = start + value + middle + b.operand + end;
    return {
      tex,
      ranges: [
        { start: start.length, end: start.length + value.length, tag: `member${side}` },
        {
          start: start.length + value.length + middle.length,
          end: tex.length - end.length,
          tag: `operand${side}`,
        },
        { start: 0, end: tex.length, tag: `side${side}` },
      ],
    };
  };
  const first = member(b.left, 'Left'),
    second = member(b.right, 'Right');
  const prefix = previous.slice(0, left.start),
    suffix = previous.slice(right.end);
  const offset = prefix.length + first.tex.length + destinationRelation.length;
  const intermediate = {
    tex: prefix + first.tex + destinationRelation + second.tex + suffix,
    ranges: [
      ...first.ranges.map((r) => ({
        ...r,
        start: r.start + prefix.length,
        end: r.end + prefix.length,
      })),
      { start: prefix.length + first.tex.length, end: offset, tag: 'relation' },
      ...second.ranges.map((r) => ({ ...r, start: r.start + offset, end: r.end + offset })),
    ],
  };
  return {
    source: [scope, left, relation, right],
    target: [out, toLeft, toRelation, toRight],
    intermediate,
    destinationRelation,
  };
}
export function simplifyPlan(previous: string, step: Step) {
  const s = step.simplify;
  if (!s) throw new Error('No simplification operation.');
  const source = inside(previous, s.source, 'replacement', sourceScope(previous, step));
  const result = inside(step.tex, s.result, 'result', targetScope(step));
  // A simplification replaces exactly the selected local expression. The rest
  // is allowed to change only in whitespace, never in mathematical content.
  const oldContext = previous.slice(0, source.start) + previous.slice(source.end);
  const newContext = step.tex.slice(0, result.start) + step.tex.slice(result.end);
  if (oldContext.replace(/\s/g, '') !== newContext.replace(/\s/g, ''))
    throw new Error('A simplification must preserve the surrounding expression.');
  const tex = `${s.source}=${s.result}`;
  const cancellation: Range[] = [];
  if (s.cancel) {
    const { factor, quotient } = s.cancel;
    if (!s.condition?.trim()) throw new Error('Factor cancellation requires a nonzero condition.');
    // Deliberately narrow grammar: a variable or e raised to one variable,
    // multiplying a quotient with exactly that denominator. A compound
    // denominator must be braced: \frac2e^x means (2/e)^x, not 2/(e^x).
    // It can never strike a term of a sum (a+b)/a or a shared function name.
    if (!/^(?:[A-Za-z]|e\^[A-Za-z])$/.test(factor))
      throw new Error('Cancellation supports a named variable or a simple exponential factor.');
    const match = /^\\frac(?:\{([^{}]+)\}|([^{}\\\s]))(?:\{([^{}]+)\}|([A-Za-z]))$/.exec(
      quotient,
    );
    if (!match || (match[3] || match[4]) !== factor)
      throw new Error('Cancellation denominator must be exactly the common factor.');
    const signed = ['', '+', '-'].flatMap((sign) => [
      quotient,
      `(${sign}${quotient})`,
      `\\left(${sign}${quotient}\\right)`,
    ]);
    const allowed = ['', '+', '-'].flatMap((prefix) =>
      ['\\cdot', '\\times'].flatMap((operator) =>
        signed.map((q) => `${prefix}${factor}${operator}${q}`),
      ),
    );
    if (!allowed.includes(s.source.replace(/\s/g, '')))
      throw new Error('Cancellation applies to a product, never to additive terms.');
    const q = select(s.source, quotient, 'quotient');
    const external = select(s.source, factor, 'cancelFactor');
    if (external.end > q.start) throw new Error('Missing external common factor.');
    const denominatorStart =
      q.start + quotient.length - (quotient.endsWith('}') ? factor.length + 1 : factor.length);
    cancellation.push(external, {
      start: denominatorStart,
      end: denominatorStart + factor.length,
      tag: 'cancelDenominator',
    });
  }
  return {
    source: [
      source,
      { ...source, tag: 'focus' },
      ...cancellation.map((r) => ({
        ...r,
        start: r.start + source.start,
        end: r.end + source.start,
      })),
    ],
    target: [result, { ...result, tag: 'focus' }],
    equality: {
      tex,
      ranges: [
        { start: 0, end: s.source.length, tag: 'replacement' },
        { start: s.source.length, end: s.source.length + 1, tag: 'relation' },
        { start: s.source.length + 1, end: tex.length, tag: 'result' },
        ...cancellation,
      ],
    },
  };
}
