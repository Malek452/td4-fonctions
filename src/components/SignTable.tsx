import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SignTableFrame } from '../types';
import { MathView } from './Math';
import { ui } from '../ui';
export function SignTable({
  frame,
  reduced,
  speed,
  pauseSignal,
}: {
  frame: SignTableFrame;
  reduced: boolean;
  speed: number;
  pauseSignal: number;
}) {
  const initialPause = useRef(pauseSignal),
    [paused, setPaused] = useState(false);
  useEffect(() => {
    if (pauseSignal !== initialPause.current) setPaused(true);
  }, [pauseSignal]);
  const { model, visibleRows, activeRow, selectedIntervals, selectedPoints } = frame;
  const animate = (column: number): CSSProperties => ({
    animationDuration: `${0.38 / speed}s`,
    animationDelay: `${(column * 0.13) / speed}s`,
    animationPlayState: paused ? 'paused' : 'running',
  });
  const entry = (tex: string, column: number, active: boolean) => (
    <span className={active && !reduced ? 'sign-enter' : ''} style={animate(column)}>
      {tex === 'bar' ? (
        <span className="sign-forbidden" role="img" aria-label={ui.forbidden} />
      ) : (
        <MathView tex={tex} />
      )}
    </span>
  );
  return (
    <div className="sign-table-scroll" tabIndex={0} role="region" aria-label={ui.tableRegion}>
      <table className="sign-table">
        <caption className="sr-only">{ui.table}</caption>
        <thead>
          <tr className={activeRow === -1 ? 'sign-active' : ''}>
            <th scope="col">
              <MathView tex="x" />
            </th>
            <th scope="col">
              <MathView tex={'-\\infty'} />
            </th>
            {model.points.flatMap((p, i) => [
              <th scope="col" key={`interval${i}`} />,
              <th scope="col" key={`point${i}`}>
                {entry(p.tex, i, activeRow === -1)}
              </th>,
            ])}
            <th scope="col" />
            <th scope="col">
              <MathView tex={'+\\infty'} />
            </th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, r) => (
            <tr
              key={row.label}
              className={
                (r === activeRow && !selectedIntervals ? 'sign-active ' : '') +
                (r === model.rows.length - 1 ? 'sign-result' : '')
              }
            >
              <th scope="row">
                <MathView tex={row.label} />
              </th>
              <td />
              {row.intervals.flatMap((sign, i) => {
                const cells = [
                  <td
                    key={`i${i}`}
                    className={
                      r === model.rows.length - 1 && selectedIntervals?.includes(i)
                        ? 'sign-selected'
                        : ''
                    }
                  >
                    {r < visibleRows
                      ? entry(sign, i * 2, r === activeRow && !selectedIntervals)
                      : null}
                  </td>,
                ];
                if (i < model.points.length)
                  cells.push(
                    <td
                      key={`p${i}`}
                      className={
                        r === model.rows.length - 1 && selectedPoints?.includes(i)
                          ? 'sign-selected'
                          : ''
                      }
                    >
                      {r < visibleRows && row.points[i]
                        ? entry(row.points[i], i * 2 + 1, r === activeRow && !selectedIntervals)
                        : null}
                    </td>,
                  );
                return cells;
              })}
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
