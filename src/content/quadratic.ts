import type { Step } from '../types';

export interface Quadratic {
  a: number;
  b: number;
  c: number;
  variable?: 'x' | 'X';
  /** Reviewed exact simplified roots, in the minus/plus order. */
  roots: [string, string];
}
const fraction = (n: string, d: string | number) => `\\frac{${n}}{${d}}`;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const step = (
  title: string,
  tex: string,
  why: string,
  focus?: string,
  fromFocus?: string,
): Step => ({
  title,
  tex,
  why,
  ...(focus ? { focus } : {}),
  ...(fromFocus ? { fromFocus } : {}),
});

/** A deliberately slow, reusable derivation for the positive-discriminant case.
 * One substitution or arithmetic operation per frame; no numerical approximation. */
export function discriminantSteps({ a, b, c, variable = 'x' }: Omit<Quadratic, 'roots'>): Step[] {
  if (![a, b, c].every(Number.isSafeInteger) || a === 0 || !Number.isSafeInteger(b * b - 4 * a * c))
    throw new Error('This authoring helper requires safe integer coefficients and a nonzero a.');
  const delta = b * b - 4 * a * c;
  const out: Step[] = [
    {
      ...step(
        'Identifier les coefficients',
        `a=${a},\\quad b=${b},\\quad c=${c}`,
        `Dans a${variable}² + b${variable} + c = 0, a = ${a}, b = ${b} et c = ${c}. On conserve le signe de chaque coefficient.`,
      ),
      focus: `a=${a},\\quad b=${b},\\quad c=${c}`,
      statement: true,
    },
    {
      ...step(
        'Écrire la formule du discriminant',
        '\\Delta=b^2-4ac',
        'Pour un trinôme ax² + bx + c avec a ≠ 0, on définit Δ = b² − 4ac. Il y a deux racines réelles distinctes si Δ > 0, une racine double si Δ = 0 et aucune racine réelle si Δ < 0.',
      ),
      statement: true,
    },
    step(
      'Remplacer b dans le discriminant',
      `\\Delta=(${b})^2-4ac`,
      `On remplace seulement b par ${b}. Les parenthèses gardent le signe de b dans le carré.`,
      `(${b})^2`,
      'b^2',
    ),
    {
      ...step(
        'Remplacer a dans le discriminant',
        `\\Delta=(${b})^2-4\\times(${a})\\times c`,
        `On remplace a par ${a}. Le coefficient c attend l’étape suivante.`,
        `\\times(${a})`,
        'a',
      ),
    },
    {
      ...step(
        'Remplacer c dans le discriminant',
        `\\Delta=(${b})^2-4\\times(${a})\\times(${c})`,
        `On remplace enfin c par ${c}, avec son signe. Tous les coefficients sont maintenant en place ; on peut commencer les calculs.`,
        `\\times(${c})`,
        'c',
      ),
      focusOccurrence: a === c ? 2 : 1,
    },
    step(
      'Calculer le carré de b',
      `\\Delta=${b * b}-4\\times(${a})\\times(${c})`,
      `(${b}) × (${b}) = ${b * b}. Les autres opérations attendent.`,
      `${b * b}`,
      `(${b})^2`,
    ),
    step(
      'Calculer 4 × a',
      `\\Delta=${b * b}-(${4 * a})\\times(${c})`,
      `4 × ${a} = ${4 * a}. Il reste à multiplier ce nombre par c.`,
      `(${4 * a})`,
      `4\\times(${a})`,
    ),
    step(
      'Calculer 4ac',
      `\\Delta=${b * b}-(${4 * a * c})`,
      `${4 * a} × (${c}) = ${4 * a * c}. Le signe moins de la formule reste devant ce produit.`,
      `(${4 * a * c})`,
      `(${4 * a})\\times(${c})`,
    ),
  ];
  if (4 * a * c < 0)
    out.push(
      step(
        'Soustraire un nombre négatif',
        `\\Delta=${b * b}+${-4 * a * c}`,
        `Soustraire ${4 * a * c} revient à ajouter ${-4 * a * c}.`,
        `+${-4 * a * c}`,
        `-(${4 * a * c})`,
      ),
    );
  out.push(
    step(
      'Obtenir le discriminant',
      `\\Delta=${delta}`,
      delta > 0
        ? `Δ = ${delta} > 0 : le trinôme possède deux racines réelles distinctes.`
        : delta < 0
          ? `Δ = ${delta} < 0 : le trinôme ne possède aucune racine réelle.`
          : 'Δ = 0 : le trinôme possède une racine double.',
      undefined,
      4 * a * c < 0 ? `${b * b}+${-4 * a * c}` : `${b * b}-(${4 * a * c})`,
    ),
  );
  return out;
}

export function quadraticSteps({ a, b, c, variable = 'x', roots }: Quadratic): Step[] {
  const delta = b * b - 4 * a * c;
  if (
    ![a, b, c].every(Number.isSafeInteger) ||
    !Number.isSafeInteger(delta) ||
    delta <= 0 ||
    delta > 1000000 ||
    a === 0
  )
    throw new Error(
      'quadraticSteps requires integer coefficients, a nonzero a, and 0 < Δ ≤ 1000000.',
    );
  let squareFactor = 1;
  for (let n = 2; n * n <= delta; n++) if (delta % (n * n) === 0) squareFactor = n;
  const remainder = delta / (squareFactor * squareFactor);
  const radical =
    remainder === 1
      ? `${squareFactor}`
      : `${squareFactor === 1 ? '' : squareFactor}\\sqrt{${remainder}}`;
  const out: Step[] = [
    {
      ...step(
        'Chercher les zéros du trinôme',
        `${a === 1 ? '' : a}${variable}^2${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}${variable}${c < 0 ? '-' : '+'}${Math.abs(c)}=0`,
        'Pour trouver les racines, on résout l’équation « trinôme = 0 ». Ces valeurs serviront ensuite à répondre à la question de départ.',
      ),
      phase: 'Rechercher les racines',
      statement: true,
    },
    ...discriminantSteps({ a, b, c, variable }),
  ];
  out.push({
    ...step(
      'Remplacer Δ sous la racine',
      `\\sqrt{\\Delta}=\\sqrt{${delta}}`,
      `Δ = ${delta} > 0. Sa racine carrée √Δ est l’unique réel strictement positif dont le carré vaut ${delta}.`,
    ),
    statement: true,
  });
  if (remainder > 1 && squareFactor > 1)
    out.push(
      step(
        'Extraire un carré parfait',
        `\\sqrt{\\Delta}=\\sqrt{${squareFactor * squareFactor}\\times${remainder}}`,
        `${delta} = ${squareFactor * squareFactor} × ${remainder}. Le facteur ${squareFactor * squareFactor} est le carré de ${squareFactor}.`,
      ),
    );
  if (squareFactor > 1)
    out.push(
      step(
        'Calculer la racine de Δ',
        `\\sqrt{\\Delta}=${radical}`,
        remainder === 1
          ? `${squareFactor} > 0 et ${squareFactor}² = ${delta}, donc √Δ = ${squareFactor}, par définition de la racine carrée.`
          : `Pour u ≥ 0 et v ≥ 0, √(uv) = √u × √v. Ainsi √(${squareFactor * squareFactor} × ${remainder}) = ${squareFactor}√${remainder}, puisque √${squareFactor * squareFactor} = ${squareFactor}.`,
      ),
    );

  for (const [index, sign] of ['-', '+'].entries()) {
    const prefix = `${variable}_${index + 1}=`;
    const sqrtDelta = '\\sqrt{\\Delta}';
    out.push({
      ...step(
        index === 0
          ? 'Écrire la formule de la première racine'
          : 'Écrire la formule de la seconde racine',
        prefix + fraction(`-b${sign}${sqrtDelta}`, '2a'),
        index === 0
          ? 'Comme a ≠ 0 et Δ > 0, les racines sont (−b − √Δ)/(2a) et (−b + √Δ)/(2a). On calcule d’abord la première : tout le numérateur est divisé par 2a.'
          : 'La première racine est calculée. Pour obtenir la seconde, on reprend la formule avec le signe plus devant √Δ ; le dénominateur reste 2a.',
        `${sign}${sqrtDelta}`,
      ),
      statement: true,
    });
    out.push(
      step(
        'Remplacer b avec son signe',
        prefix + fraction(`-(${b})${sign}${sqrtDelta}`, '2a'),
        `b = ${b}, donc −b s’écrit −(${b}). On garde le signe ${sign === '-' ? 'moins' : 'plus'} devant la racine.`,
        `-(${b})`,
        '-b',
      ),
    );
    out.push(
      step(
        'Remplacer a au dénominateur',
        prefix + fraction(`-(${b})${sign}${sqrtDelta}`, `2\\times(${a})`),
        `a = ${a}, donc le dénominateur 2a devient 2 × (${a}).`,
        `2\\times(${a})`,
        '2a',
      ),
    );
    out.push(
      step(
        'Remplacer Δ dans la formule',
        prefix + fraction(`-(${b})${sign}\\sqrt{${delta}}`, `2\\times(${a})`),
        `On remplace Δ par ${delta} sous la racine carrée.`,
        `\\sqrt{${delta}}`,
        sqrtDelta,
      ),
    );
    if (squareFactor > 1)
      out.push(
        step(
          'Utiliser la racine carrée calculée',
          prefix + fraction(`-(${b})${sign}${radical}`, `2\\times(${a})`),
          `On utilise la valeur exacte de √Δ obtenue précédemment. Le signe ${sign === '-' ? 'moins' : 'plus'} devant cette valeur est conservé.`,
          `${sign}${radical}`,
          `\\sqrt{${delta}}`,
        ),
      );
    out.push(
      step(
        'Calculer le dénominateur',
        prefix + fraction(`-(${b})${sign}${radical}`, 2 * a),
        `2 × (${a}) = ${2 * a}. Tout le numérateur reste au-dessus de la barre.`,
        `{${2 * a}}`,
        `2\\times(${a})`,
      ),
    );
    const numerator =
      remainder === 1
        ? `${-b + (sign === '-' ? -squareFactor : squareFactor)}`
        : `${-b}${sign}${radical}`;
    out.push(
      step(
        remainder === 1 ? 'Calculer le numérateur' : 'Simplifier le signe de −b',
        prefix + fraction(numerator, 2 * a),
        remainder === 1
          ? `Au numérateur, −(${b}) ${sign === '-' ? '−' : '+'} ${squareFactor} = ${numerator}.`
          : `L’opposé de ${b} est ${-b}. La racine reste sous forme exacte.`,
        `{${numerator}}`,
        remainder === 1 ? `-(${b})${sign}${radical}` : `-(${b})`,
      ),
    );
    const divisor =
      remainder === 1 ? gcd(Number(numerator), 2 * a) : gcd(gcd(b, 2 * a), squareFactor);
    if (divisor > 1)
      out.push(
        step(
          'Simplifier la fraction',
          prefix + roots[index],
          remainder === 1
            ? `On divise le numérateur ${numerator} et le dénominateur ${2 * a} par leur diviseur commun non nul ${divisor}. Cette simplification conserve la valeur de la fraction.`
            : `On divise tous les termes du numérateur et le dénominateur par leur facteur commun ${divisor}.`,
          undefined,
          fraction(numerator, 2 * a),
        ),
      );
  }
  return out;
}
