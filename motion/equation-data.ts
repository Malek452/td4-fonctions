/** Geometry is prepared by MathJax during the build, not by a paid service. */
export interface Glyph {
  path: string;
  symbol: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
  bounds: [number, number, number, number];
  tags: string[];
}
export interface Equation {
  tex: string;
  width: number;
  height: number;
  glyphs: Glyph[];
}
export interface PreparedStep {
  target: string;
  source: string;
  semantic?: 'product' | 'quotient' | 'power' | 'distribute';
  statement?: boolean;
  work?: { expression: string; result: string; via?: string };
  balance?: {
    intermediate: string;
    operand: string;
    operation: 'add' | 'subtract' | 'multiply' | 'divide';
    condition?: string;
    reverses: boolean;
  };
  simplify?: { equality: string; rule: string; condition?: string; cancel?: boolean };
}
export interface EquationData {
  paths: Record<string, string>;
  equations: Record<string, Equation>;
  activities: Record<string, PreparedStep[]>;
}
