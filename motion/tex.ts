/**
 * Motion Canvas 3.17 treats `{{...}}` as animation segments and removes those
 * braces before MathJax sees them. Nested TeX groups (especially a highlighted
 * exponent) can accidentally become segments and lose their mathematical scope.
 * A space between adjacent opening braces preserves the groups and their layout
 * in math mode while avoiding that reserved syntax. Apply at every Latex input,
 * including intermediate formulas; keep the source and KaTeX fallback untouched.
 */
export function motionTex(tex: string): string {
  return tex.replace(/\{(?=\{)/g, '{ ');
}
