import { renderToStaticMarkup } from 'react-dom/server';
import type { Step } from '../types';
import { GraphSlide, graphDescriptions } from './GraphSlide';
import { SignTable } from './SignTable';

/** Reuse the same accessible SVGs and table cells in the printable handout. */
export function renderPrintSurface(step: Step): string {
  if (step.graph || step.circle)
    return renderToStaticMarkup(<GraphSlide graph={step.graph} circle={step.circle} tex={step.tex} />);
  if (step.table)
    return renderToStaticMarkup(<SignTable frame={step.table} reduced speed={1} pauseSignal={0} />);
  return '';
}

export function describePrintSurface(step: Step): string {
  if (step.graph) return graphDescriptions[step.graph];
  if (step.circle) return `Cercle trigonométrique : ${step.circle.axis === 'cos' ? 'le cosinus est l’abscisse du point associé à l’angle' : 'le sinus est l’ordonnée du point associé à l’angle'}.`;
  if (step.table) {
    const {model, visibleRows} = step.table;
    return `Tableau de signes. Valeurs repérées : ${model.points.map(p => p.tex).join(', ')}. ` +
      model.rows.slice(0, visibleRows).map(row => `${row.label} : ${row.intervals.join(', ')} sur les intervalles successifs ; aux valeurs repérées : ${row.points.map(p => p === 'bar' ? 'non défini' : p || 'non nul').join(', ')}.`).join(' ');
  }
  return '';
}
