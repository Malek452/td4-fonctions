import type { Exercise, SignTableModel } from '../src/types';
import { signTableSteps } from '../src/content/sign-tables';
const t = String.raw;
const model: SignTableModel = {
  id: 'quotient-signs',
  points: [
    { tex: '-2', value: -2 },
    { tex: '1', value: 1 },
  ],
  rows: [
    { label: 'x-1', intervals: ['-', '-', '+'], points: ['', '0'] },
    { label: 'x+2', intervals: ['-', '+', '+'], points: ['0', ''] },
    { label: t`\frac{x-1}{x+2}`, intervals: ['+', '-', '+'], points: ['bar', '0'] },
  ],
};
export default {
  id: 3,
  title: 'Étudier le signe d’un quotient',
  short: 'Signes',
  theme: 'Inéquations',
  level: 'Progressif',
  minutes: 8,
  description: 'Un tableau français construit ligne par ligne, avec une valeur interdite.',
  objectives: ['Distinguer un zéro d’une valeur interdite', 'Lire les intervalles solutions'],
  prerequisites: ['Fonction affine', 'Intervalles'],
  color: 'sage',
  activities: [
    {
      id: 'sign-table',
      label: 'Quotient et valeur interdite',
      prompt: 'Résoudre dans ℝ.',
      tex: t`\frac{x-1}{x+2}\ge0`,
      result: t`S=]-\infty,-2[\cup[1,+\infty[`,
      visual: 'signs',
      steps: [
        {
          title: 'Lire l’inéquation',
          tex: t`\frac{x-1}{x+2}\ge0`,
          why: 'On cherche tous les réels x pour lesquels ce quotient existe et est positif ou nul. On commence par exclure les valeurs qui annulent son dénominateur.',
          phase: 'Énoncé',
        },
        {
          title: 'Déterminer la condition d’existence',
          tex: t`x\ne-2`,
          why: 'Le dénominateur x + 2 doit être non nul. On conserve x ≠ −2 pendant toute la résolution.',
          phase: 'Condition d’existence',
          statement: true,
        },
        {
          title: 'Repérer les deux valeurs critiques',
          tex: 'x+2=0\\iff x=-2;\\qquad x-1=0\\iff x=1',
          why: '−2 annule le dénominateur ; 1 annule le numérateur. Les deux valeurs ont des rôles différents.',
          statement: true,
          phase: 'Étudier les signes',
        },
        ...signTableSteps(
          model,
          [
            'x − 1 est strictement négatif pour x < 1, nul en 1 et strictement positif pour x > 1.',
            'x + 2 est strictement négatif pour x < −2, nul en −2 et strictement positif pour x > −2.',
            'Le quotient est strictement positif lorsque les signes sont identiques. Il est nul en 1 et non défini en −2, d’où la double barre.',
          ],
          [0, 2],
          [1],
          'On retient les intervalles de signe + et le zéro en 1. La valeur −2 reste interdite, même pour une inégalité large.',
        ),
        {
          title: 'Écrire l’ensemble des solutions',
          tex: t`S=]-\infty,-2[\cup[1,+\infty[`,
          why: 'Le quotient est positif ou nul exactement sur ces intervalles. La borne −2 est exclue et la borne 1 est incluse.',
          phase: 'Conclusion',
          statement: true,
        },
      ],
    },
  ],
} satisfies Exercise;
