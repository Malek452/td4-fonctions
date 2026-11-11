import type { Exercise } from '../src/types';
import { expandBinomial } from '../src/content/binomial';
import { quadraticSteps } from '../src/content/quadratic';
const t = String.raw;
export default {
  id: 2,
  title: 'Développer et résoudre',
  short: 'Algèbre',
  theme: 'Algèbre',
  level: 'Progressif',
  minutes: 15,
  description:
    'Distribuer, calculer les produits, regrouper, puis distinguer les phases d’une résolution.',
  objectives: [
    'Justifier la distributivité',
    'Réunir les termes semblables',
    'Appliquer les formules des racines',
  ],
  prerequisites: ['Produit', 'Somme', 'Discriminant'],
  color: 'sage',
  activities: [
    {
      id: 'distributivity',
      label: 'Développer un produit',
      prompt: 'Développer et réduire.',
      tex: '(x+2)(x-1)',
      result: 'x^2+x-2',
      visual: 'algebra',
      steps: [
        {
          title: 'Lire les deux facteurs',
          tex: '(x+2)(x-1)',
          why: 'Chaque terme du premier facteur multiplie chaque terme du second facteur. On écrit les produits avant de les calculer.',
          phase: 'Énoncé',
        },
        ...expandBinomial((expression) => expression, 2, -1).map((step, i) => ({
          ...step,
          ...(i === 0 ? { phase: 'Développer' } : {}),
        })),
        {
          title: 'Conclure',
          tex: '(x+2)(x-1)=x^2+x-2',
          why: 'La distributivité et le regroupement des termes en x donnent cette identité, valable pour tout réel x.',
          phase: 'Conclusion',
        },
      ],
    },
    {
      id: 'quadratic',
      label: 'Deux racines réelles',
      prompt: 'Résoudre dans ℝ.',
      tex: '2x^2+3x-5=0',
      result: t`S=\{-\tfrac52,1\}`,
      visual: 'algebra',
      steps: [
        {
          title: 'Identifier le problème',
          tex: '2x^2+3x-5=0',
          why: 'Le polynôme est défini sur ℝ. On cherche toutes les valeurs qui l’annulent.',
          phase: 'Énoncé',
        },
        ...quadraticSteps({ a: 2, b: 3, c: -5, roots: [t`-\frac52`, '1'] }).map((step) => ({
          ...step,
          ...(step.title === 'Écrire la formule du discriminant'
            ? { phase: 'Calculer le discriminant' }
            : {}),
          ...(step.title === 'Écrire la formule de la première racine'
            ? { phase: 'Calculer la première racine' }
            : {}),
          ...(step.title === 'Écrire la formule de la seconde racine'
            ? { phase: 'Calculer la seconde racine' }
            : {}),
        })),
        {
          title: 'Conclure',
          tex: t`S=\{-\tfrac52,1\}`,
          why: 'Le discriminant est strictement positif. Les deux racines calculées sont exactement les deux solutions réelles.',
          phase: 'Conclusion',
          statement: true,
        },
      ],
    },
  ],
} satisfies Exercise;
