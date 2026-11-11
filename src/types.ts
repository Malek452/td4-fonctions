export type Visual =
  | 'powers'
  | 'signs'
  | 'substitution'
  | 'logs'
  | 'trig'
  | 'fold'
  | 'tide'
  | 'algebra';
export interface SignRow {
  label: string;
  intervals: ('+' | '-')[];
  points: ('' | '0' | 'bar')[];
}
export interface SignTableModel {
  id: string;
  points: { tex: string; value: number }[];
  rows: SignRow[];
}
export interface SignTableFrame {
  model: SignTableModel;
  visibleRows: number;
  activeRow: number;
  selectedIntervals?: number[];
  selectedPoints?: number[];
}
export interface Step {
  title: string;
  tex: string;
  why: string;
  /** Plain-text explanation on the main board; does not accept HTML. */
  prose?: string[];
  /** Named part of the reasoning, inherited until the next explicit phase. */
  phase?: string;
  /** Exact source fragment to highlight before the current transformation. */
  fromFocus?: string;
  fromFocusOccurrence?: number;
  /** A single product, animated before returning to the full expression. */
  product?: { left: string; right: string; result: string };
  /** Terms selected in the preceding expression, with an explicit coefficient calculation. */
  collect?: { left: string; right: string; result: string; via: string };
  /** Apply one identical operation to both members; the intermediate is generated. */
  balance?: {
    operation: 'add' | 'subtract' | 'multiply' | 'divide';
    operand: string;
    left: string;
    right: string;
    /** =, <, >, or TeX \\le / \\ge / \\leq / \\geq (checked structurally). */
    relation: string;
    toLeft: string;
    toRight: string;
    /** TeX hypothesis, displayed during the operation (required for × and ÷). */
    condition?: string;
    /** Multiplication/division reverses an inequality exactly when negative. */
    sign?: 'positive' | 'negative' | 'nonzero';
  };
  /** Replace an exact subexpression using an explicitly displayed equality and rule. */
  simplify?: {
    source: string;
    result: string;
    rule: string;
    condition?: string;
    /** Restricted cancellation of a nonzero factor in factor × (numerator/factor). */
    cancel?: { factor: string; quotient: string };
  };
  /** Explicit power law: fromFocus and to delimit the operation, not its neighbours. */
  power?: {
    kind: 'product' | 'quotient' | 'power';
    base: string;
    left: string;
    right: string;
    to: string;
    /** Parentheses can be added while retaining the complete source exponent. */
    targetLeft?: string;
    targetRight?: string;
  };
  /** Copy a common factor to one term; keep the original on the remaining terms. */
  distribute?: {
    factor: string;
    term: string;
    product: string;
    remainder: string;
    side?: 'left' | 'right';
    /** Exact remaining sum in source and destination, retained as a whole. */
    remainingTerm?: string;
  };
  /** A formula/theorem is a new statement, not a transformation of the preceding number. */
  statement?: boolean;
  table?: SignTableFrame;
  /** Exact reference curves and a dedicated trigonometric inequality figure. */
  graph?:
    | 'log'
    | 'exp'
    | 'cosine-equation'
    | 'sine-cosine-equation'
    | 'cosine-abscissas'
    | 'cosine-inequality'
    | 'domain-extension-a'
    | 'domain-extension-b'
    | 'domain-extension-c'
    | 'odd-function'
    | 'non-even-function'
    | 'sine-inequality-ordinates'
    | 'sine-inequality-arc'
    | 'sine-equality'
    | 'shifted-sine-equation';
  /** Optional diagram only on the step where it is explained. */
  diagram?: 'fold';
  circle?: { angle: number; label: string; axis: 'sin' | 'cos' };
  /** Exact part to underline; defaults to the last top-level equality member. */ focus?: string;
  /** One-based occurrence when the exact fragment occurs more than once. */
  focusOccurrence?: number;
}
export interface Activity {
  id: string;
  label: string;
  prompt: string;
  tex: string;
  result: string;
  steps: Step[];
  visual: Visual;
  note?: string;
  initialDomain?: string;
}
export interface Exercise {
  id: number;
  title: string;
  short: string;
  theme: string;
  level: string;
  minutes: number;
  objectives: string[];
  prerequisites: string[];
  description: string;
  color: string;
  activities: Activity[];
}
