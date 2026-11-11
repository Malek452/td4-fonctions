import type { Exercise } from '../src/types';
import { textStep } from '../src/content/define';
export default {
  id: 5,
  title: 'Présenter une notion',
  short: 'Explications',
  theme: 'Proportions',
  level: 'Introduction',
  minutes: 3,
  description: 'Un exemple de présentation textuelle sur le même tableau.',
  objectives: ['Définir une proportion', 'Relier fraction et pourcentage'],
  prerequisites: ['Fractions'],
  color: 'sage',
  activities: [
    {
      id: 'proportions',
      label: 'Comprendre une proportion',
      prompt: 'Que signifie une proportion de 25 % ?',
      tex: 'p=\\frac{n}{N}',
      result: '25\\%=\\frac14',
      visual: 'algebra',
      steps: [
        textStep(
          'Choisir la population de référence',
          [
            'Une proportion compare l’effectif d’un groupe à l’effectif total.',
            'Le groupe doit faire partie de cette population, et l’effectif total doit être non nul.',
          ],
          'Ces conditions donnent une proportion comprise entre 0 et 1.',
          'Définition',
        ),
        textStep(
          'Relier fraction et pourcentage',
          [
            '25 % signifie 25 sur 100.',
            'En divisant le numérateur et le dénominateur par 25, on obtient un quart.',
          ],
          '25/100 = 1/4 : les deux écritures représentent la même proportion.',
          'Exemple',
        ),
        textStep(
          'Interpréter le résultat',
          [
            'Si une proportion de 25 % porte sur 200 individus, elle correspond à 50 individus.',
            'Le pourcentage seul ne donne pas l’effectif : il faut connaître la population de référence.',
          ],
          'Un quart de 200 vaut 50. La proportion et l’effectif sont deux informations différentes.',
          'Conclusion',
        ),
      ],
    },
  ],
} satisfies Exercise;
