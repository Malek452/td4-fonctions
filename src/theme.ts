/** Preserve semantic color roles when customizing this palette.
 * The same values feed React/CSS, KaTeX highlights and Motion Canvas. */
export const theme = {
  board: '#fffefa',
  panel: '#f2f5f8',
  controls: '#edf1f5',
  line: '#8b99aa',
  text: '#14263d',
  explanation: '#26364b',
  muted: '#465b72',
  controlAccent: '#064f89',
  mathInk: '#14263d',
  active: '#9b330e',
  second: '#07589f',
  base: '#146341',
  fallbackActive: '#9b330e',
};

export function applyTheme() {
  const root = document.documentElement;
  const properties = {
    '--board': theme.board,
    '--panel': theme.panel,
    '--controls': theme.controls,
    '--line': theme.line,
    '--ink': theme.text,
    '--explanation': theme.explanation,
    '--muted': theme.muted,
    '--gold': theme.controlAccent,
    '--active': theme.active,
    '--second': theme.second,
    '--base': theme.base,
  };
  for (const [key, value] of Object.entries(properties)) root.style.setProperty(key, value);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.board);
}
