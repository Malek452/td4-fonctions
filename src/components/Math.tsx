import katex from 'katex';
import { useMemo } from 'react';
export function MathView({
  tex,
  display = false,
  className = '',
}: {
  tex: string;
  display?: boolean;
  className?: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        trust: false,
        output: 'htmlAndMathml',
        strict: 'ignore',
      }),
    [tex, display],
  );
  return (
    <span
      className={'math ' + className + (display ? ' math-display' : '')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
