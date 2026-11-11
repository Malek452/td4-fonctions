import type { SignTableFrame, SignTableModel, Step } from '../types';
export function signTableTex(frame: SignTableFrame): string {
  const { model, visibleRows } = frame;
  const header = ['x', '-\\infty'];
  for (const p of model.points) header.push('', p.tex);
  header.push('', '+\\infty');
  const rows = model.rows.map((r, index) => {
    const cells = [r.label, ''];
    for (let i = 0; i <= model.points.length; i++) {
      cells.push(index < visibleRows ? r.intervals[i] : '');
      if (i < model.points.length)
        cells.push(index < visibleRows ? (r.points[i] === 'bar' ? '\\Vert' : r.points[i]) : '');
    }
    cells.push('');
    return (index === model.rows.length - 1 ? '\\hline ' : '') + cells.join('&');
  });
  return `\\begin{array}{c|${'c'.repeat(2 * model.points.length + 3)}}\\hline ${header.join('&')}\\\\\\hline ${rows.join('\\\\')}\\\\\\hline\\end{array}`;
}
export function signTableSteps(
  model: SignTableModel,
  explanations: string[],
  selectedIntervals: number[],
  selectedPoints: number[],
  reading: string,
): Step[] {
  if (explanations.length !== model.rows.length)
    throw new Error('Each sign row needs its justification.');
  const frame = (visibleRows: number, activeRow: number, selected = false): SignTableFrame => ({
    model,
    visibleRows,
    activeRow,
    ...(selected ? { selectedIntervals, selectedPoints } : {}),
  });
  const initial = frame(0, -1);
  const out: Step[] = [
    {
      title: 'Placer les valeurs dans le tableau',
      tex: signTableTex(initial),
      why: 'La première ligne représente les réels dans l’ordre croissant, de −∞ à +∞. On y place les zéros et les valeurs interdites ; chaque intervalle sera ensuite associé à un signe.',
      statement: true,
      table: initial,
    },
  ];
  model.rows.forEach((r, i) => {
    const table = frame(i + 1, i);
    out.push({
      title:
        i === model.rows.length - 1
          ? 'Déterminer le signe de l’expression étudiée'
          : `Compléter la ligne ${i + 1}`,
      tex: signTableTex(table),
      why: explanations[i],
      statement: true,
      table,
    });
  });
  const selected = frame(model.rows.length, model.rows.length - 1, true);
  out.push({
    title: 'Lire les intervalles à conserver',
    tex: signTableTex(selected),
    why: reading,
    statement: true,
    table: selected,
  });
  return out;
}
