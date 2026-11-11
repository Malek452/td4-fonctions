import type { Step } from '../types';
const t = String.raw;

/** (x + p)(x + q), p > 0 and q < 0. Each distribution is written in full
 * before its products are calculated. wrap keeps the surrounding equation. */
export function expandBinomial(
  wrap: (expression: string) => string,
  p = 5,
  q = -1,
  title = 'Distribuer le premier facteur',
  collectTitle = 'Regrouper seulement les termes en x',
): Step[] {
  if (
    !Number.isSafeInteger(p) ||
    !Number.isSafeInteger(q) ||
    p <= 0 ||
    q >= 0 ||
    p + q === 0 ||
    !Number.isSafeInteger(p * q)
  )
    throw new Error(
      'expandBinomial supports positive integer p, negative integer q, and p + q ≠ 0. Author other cases explicitly.',
    );
  const bracket = `(x${q})`,
    qx = q === -1 ? '-x' : `${q}x`,
    px = p === 1 ? 'x' : `${p}x`,
    sum = p + q,
    sumx = `${sum < 0 ? '-' : ''}${Math.abs(sum) === 1 ? '' : Math.abs(sum)}x`;
  const s = (
    title: string,
    expression: string,
    why: string,
    focus: string,
    fromFocus: string,
  ): Step => {
    const tex = wrap(expression);
    const end = tex.indexOf(expression) + expression.lastIndexOf(focus) + focus.length;
    // A constant such as −3 may already occur in −3x, or in the left member.
    // Select the authored occurrence inside the developed expression.
    return {
      title,
      tex,
      why,
      focus,
      fromFocus,
      focusOccurrence: tex.slice(0, end).split(focus).length - 1,
    };
  };
  return [
    {
      ...s(
        title,
        `x${bracket}+${p}${bracket}`,
        `La parenthèse x ${q < 0 ? '−' : '+'} ${Math.abs(q)} multiplie chacun des termes x et ${p}. On copie cette parenthèse ; aucun produit n’est encore calculé.`,
        `x${bracket}`,
        `(x+${p})${bracket}`,
      ),
      distribute: {
        factor: bracket,
        term: 'x',
        product: `x${bracket}`,
        remainder: `${p}${bracket}`,
        side: 'right',
      },
    },
    {
      ...s(
        'Distribuer le facteur x',
        t`x\cdot x+x\cdot(${q})+${p}${bracket}`,
        `x multiplie les deux termes de la parenthèse : x, puis ${q}. On écrit les multiplications avant de les effectuer.`,
        t`x\cdot x+x\cdot(${q})`,
        `x${bracket}`,
      ),
      distribute: { factor: 'x', term: 'x', product: t`x\cdot x`, remainder: t`x\cdot(${q})` },
    },
    {
      ...s(
        'Calculer x × x',
        t`x^2+x\cdot(${q})+${p}${bracket}`,
        'x × x = x². Les autres produits et les signes extérieurs restent inchangés.',
        'x^2',
        t`x\cdot x`,
      ),
      product: { left: 'x', right: 'x', result: 'x^2' },
    },
    {
      ...s(
        `Calculer x × (${q === -1 ? '−1' : '−' + Math.abs(q)})`,
        `x^2${qx}+${p}${bracket}`,
        `x × (${q}) = ${q === -1 ? '−x' : '−' + Math.abs(q) + 'x'}. On conserve le signe négatif avec le terme.`,
        qx,
        t`x\cdot(${q})`,
      ),
      product: { left: 'x', right: `(${q})`, result: qx },
    },
    {
      ...s(
        `Distribuer le facteur ${p}`,
        t`x^2${qx}+${p}\cdot x+${p}\cdot(${q})`,
        `On passe maintenant au facteur ${p}. Il multiplie x, puis ${q} ; les deux produits sont d’abord écrits.`,
        t`${p}\cdot x+${p}\cdot(${q})`,
        `${p}${bracket}`,
      ),
      distribute: {
        factor: `${p}`,
        term: 'x',
        product: t`${p}\cdot x`,
        remainder: t`${p}\cdot(${q})`,
      },
    },
    {
      ...s(
        `Calculer ${p} × x`,
        t`x^2${qx}+${px}+${p}\cdot(${q})`,
        `${p} × x = ${px}. Le dernier produit reste écrit.`,
        `+${px}`,
        t`${p}\cdot x`,
      ),
      product: { left: `${p}`, right: 'x', result: px },
    },
    {
      ...s(
        `Calculer ${p} × (−${Math.abs(q)})`,
        `x^2${qx}+${px}${p * q}`,
        `${p} × (${q}) = ${p * q}. On a calculé les quatre produits, un à un.`,
        `${p * q}`,
        t`${p}\cdot(${q})`,
      ),
      product: { left: `${p}`, right: `(${q})`, result: `${p * q}` },
    },
    {
      ...s(
        collectTitle,
        `x^2${sum < 0 ? '' : '+'}${sumx}${p * q}`,
        `${qx.replace('-', '−')} + ${px} = (${q} + ${p})x = ${sumx.replace('-', '−')}. Seuls les termes en x sont réunis ; x² et la constante restent en place.`,
        sumx,
        `${qx}+${px}`,
      ),
      collect: { left: qx, right: px, result: sumx, via: `(${q}+${p})x` },
    },
  ];
}
