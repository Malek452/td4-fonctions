import type { Exercise, Step } from '../types';

/** Plain-text slides use the same board and controls. tex is a printable fallback.
 * It is not used as an instruction to morph unrelated prose into algebra. */
export function textStep(title: string, paragraphs: string[], why: string, phase?: string): Step {
  return { title, tex: '\\text{Présentation}', prose: paragraphs, why, phase, statement: true };
}

/** Fail during preparation, before an invalid deck can be published.
 * Structural checks do NOT establish mathematical truth. */
export function definePresentation(sections: Exercise[]): Exercise[] {
  const fail = (message: string): never => {
    throw new Error('Presentation: ' + message);
  };
  if (!sections.length) fail('at least one section is required.');
  const sectionIds = new Set<number>(),
    ids = new Set<string>();
  for (const section of sections) {
    if (!Number.isSafeInteger(section.id) || section.id < 1 || sectionIds.has(section.id))
      fail('section IDs must be unique positive integers.');
    sectionIds.add(section.id);
    if (!section.title.trim() || !section.short.trim() || !section.activities.length)
      fail('each section needs a title, navigation label and activity.');
    for (const activity of section.activities) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(activity.id) || ids.has(activity.id))
        fail('activity IDs must be unique URL-safe strings: ' + activity.id);
      ids.add(activity.id);
      if (!activity.label.trim() || !activity.steps.length)
        fail(activity.id + ': label and steps required.');
      for (const [i, step] of activity.steps.entries()) {
        const at = `${activity.id}, step ${i + 1}`;
        if (!step.title.trim() || !step.why.trim() || !step.tex.trim())
          fail(at + ': title, tex and why are required.');
        if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(step.tex))
          fail(at + ': invalid TeX escape; use String.raw or doubled backslashes.');
        const transforms = [
          step.product,
          step.collect,
          step.power,
          step.distribute,
          step.balance,
          step.simplify,
        ].filter(Boolean);
        if (transforms.length > 1) fail(at + ': only one semantic operation per step.');
        const surfaces = [step.table, step.circle, step.diagram, step.prose, step.graph].filter(
          Boolean,
        );
        if (surfaces.length > 1 || (surfaces.length && transforms.length))
          fail(at + ': only one presentation surface/operation per step.');
        if (i === 0 && (transforms.length || step.fromFocus))
          fail(at + ': a source expression is required before a transformation.');
        if (step.balance || step.simplify) {
          if (!step.fromFocus?.trim()) fail(at + ': an operational animation requires fromFocus.');
          if (step.statement) fail(at + ': an operation cannot introduce an unrelated statement.');
        }
        if (step.balance) {
          const b = step.balance;
          if (![b.operand, b.left, b.right, b.toLeft, b.toRight].every((s) => s.trim()))
            fail(at + ': balance members and operand must be nonempty.');
          if (!['add', 'subtract', 'multiply', 'divide'].includes(b.operation))
            fail(at + ': unknown operation on both members.');
          if (!['=', '<', '>', '\\le', '\\ge', '\\leq', '\\geq'].includes(b.relation))
            fail(at + ': unsupported balance relation.');
          if (b.operation === 'multiply' || b.operation === 'divide') {
            if (!b.condition?.trim())
              fail(at + ': multiplication/division requires its condition.');
            if (/^[-+]?0(?:\.0+)?$/.test(b.operand.trim()))
              fail(at + ': an equivalent balance operation requires a nonzero operand.');
            if (b.relation !== '=' && !['positive', 'negative'].includes(b.sign || ''))
              fail(at + ': an inequality requires the sign of its multiplier/divisor.');
          }
        }
        if (
          step.simplify &&
          ![step.simplify.source, step.simplify.result, step.simplify.rule].every((s) => s.trim())
        )
          fail(at + ': simplification needs a source, result and explicit rule.');
        if (step.prose && (!step.prose.length || step.prose.some((p) => !p.trim())))
          fail(at + ': prose needs nonempty paragraphs.');
        for (const n of [step.focusOccurrence, step.fromFocusOccurrence])
          if (n !== undefined && (!Number.isInteger(n) || n < 1))
            fail(at + ': occurrences are one-based positive integers.');
        if (step.table) {
          const {
            model,
            visibleRows,
            activeRow,
            selectedIntervals = [],
            selectedPoints = [],
          } = step.table;
          if (
            !model.rows.length ||
            model.points.some(
              (p, j) =>
                !Number.isFinite(p.value) ||
                !p.tex ||
                (j > 0 && p.value <= model.points[j - 1].value),
            )
          )
            fail(at + ': sign-table points must be finite and strictly increasing.');
          if (
            !Number.isInteger(visibleRows) ||
            visibleRows < 0 ||
            visibleRows > model.rows.length ||
            !Number.isInteger(activeRow) ||
            activeRow < -1 ||
            activeRow >= model.rows.length
          )
            fail(at + ': invalid visible/active sign row.');
          for (const row of model.rows)
            if (
              row.intervals.length !== model.points.length + 1 ||
              row.points.length !== model.points.length ||
              row.intervals.some((s) => !['+', '-'].includes(s)) ||
              row.points.some((s) => !['', '0', 'bar'].includes(s))
            )
              fail(at + ': malformed sign-table row.');
          if (
            selectedIntervals.some(
              (n) => !Number.isInteger(n) || n < 0 || n > model.points.length,
            ) ||
            selectedPoints.some(
              (n) =>
                !Number.isInteger(n) ||
                n < 0 ||
                n >= model.points.length ||
                model.rows.at(-1)!.points[n] === 'bar',
            )
          )
            fail(at + ': invalid selected interval or forbidden endpoint.');
        }
      }
    }
  }
  return sections;
}
