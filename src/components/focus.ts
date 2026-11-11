import type { Step } from '../types';
import { theme } from '../theme';
/** A letter in a TeX command (the a of \\Delta, for example) is not an operand. */
export function findMathFragment(tex: string, fragment: string, occurrence = 1): number {
  const commands = [...tex.matchAll(/\\[A-Za-z]+/g)].map((m) => [m.index!, m.index! + m[0].length]);
  let start = -1;
  for (let count = 0; count < occurrence; ) {
    start = tex.indexOf(fragment, start + 1);
    if (start < 0) return -1;
    const end = start + fragment.length;
    if (commands.some(([a, b]) => (start > a && start < b) || (end > a && end < b))) continue;
    count++;
  }
  return start;
}
/** Only split at top-level equality signs, never inside a LaTeX group or environment. */
export function focusParts(step: Step): { before: string; focus: string; after: string } {
  const tex = step.tex;
  if (step.focus) {
    const i = findMathFragment(tex, step.focus, step.focusOccurrence);
    if (i < 0) throw new Error(`Missing mathematical focus: ${step.focus} in ${tex}`);
    return { before: tex.slice(0, i), focus: step.focus, after: tex.slice(i + step.focus.length) };
  }
  let depth = 0,
    last = -1;
  if (!/\\(?:begin|left|right)/.test(tex))
    for (let i = 0; i < tex.length; i++) {
      if (tex[i] === '{' && tex[i - 1] !== '\\') depth++;
      if (tex[i] === '}' && tex[i - 1] !== '\\') depth--;
      if (tex[i] === '=' && depth === 0 && !['<', '>', '!'].includes(tex[i - 1])) last = i;
    }
  if (last > 0 && tex.slice(last + 1).trim() === '0')
    return { before: '', focus: tex.slice(0, last), after: tex.slice(last) };
  return { before: tex.slice(0, last + 1), focus: tex.slice(last + 1), after: '' };
}
export function highlightedTex(step: Step, color = theme.fallbackActive) {
  const p = focusParts(step);
  return `${p.before}{\\color{${color.replace('\\#', '#')}}\\underline{${p.focus}}}${p.after}`;
}
