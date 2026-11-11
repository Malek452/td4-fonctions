import type { Exercise } from '../src/types';
export default {
  id: 4,
  title: 'Lire le cercle trigonométrique',
  short: 'Cercle',
  theme: 'Pour aller plus loin',
  level: 'Intermédiaire',
  minutes: 5,
  description:
    'Visualiser les abscisses et ordonnées du cercle unité, puis décrire toutes les solutions.',
  objectives: ['Résoudre des équations trigonométriques', 'Exprimer des familles périodiques'],
  prerequisites: ['Radians', 'Angles remarquables'],
  activities: [
    {
      id: 'circle-sine',
      label: 'Sinus et ordonnée',
      prompt: 'Résoudre dans ℝ.',
      tex: '\\sin x=\\tfrac12',
      result:
        'x=\\tfrac\\pi6+2k\\pi\\;\\text{ou}\\;x=\\tfrac{5\\pi}6+2k\\pi,\\quad k\\in\\mathbb Z',
      steps: [
        {
          title: 'Lire l’énoncé',
          tex: '\\sin x=\\tfrac12',
          why: 'Le sinus et le cosinus sont définis sur ℝ. On cherchera les angles solutions en radians sur [0, 2π[, puis on utilisera la périodicité pour obtenir toutes les solutions réelles.',
          phase: 'Énoncé',
        },
        {
          title: 'Lire la coordonnée cherchée',
          tex: '\\sin x=1/2',
          why: 'Le sinus est l’ordonnée. La hauteur 1/2 est atteinte une fois à droite, une fois à gauche du cercle.',
          phase: 'Lire le cercle',
        },
        {
          title: 'Se placer sur un seul tour',
          tex: '0\\le x<2\\pi',
          why: 'Les angles sont en radians. Le sinus et le cosinus sont 2π-périodiques : on commence par [0, 2π[, qui décrit exactement un tour, puis on ajoutera les multiples de 2π.',
          phase: 'Étudier un tour',
          statement: true,
        },
        {
          title: 'Repérer le premier angle',
          tex: '\\sin(\\pi/6)=1/2',
          why: 'La valeur remarquable sin(π/6) = 1/2 donne un premier angle solution dans [0, 2π[.',
          circle: {
            angle: 0.5235987755982988,
            label: '\\sin(\\pi/6)=1/2',
            axis: 'sin',
          },
          phase: 'Premier point du cercle',
          statement: true,
        },
        {
          title: 'Repérer le second angle',
          tex: '\\sin(5\\pi/6)=1/2',
          why: 'La symétrie par rapport à l’axe des ordonnées conserve le sinus : sin(π − π/6) = 1/2. La droite d’ordonnée 1/2 coupe le cercle en exactement ces deux points.',
          circle: {
            angle: 2.6179938779914944,
            label: '\\sin(5\\pi/6)=1/2',
            axis: 'sin',
          },
          phase: 'Second point du cercle',
          statement: true,
        },
        {
          title: 'Retrouver tous les tours',
          tex: 'x=\\theta+2k\\pi,\\qquad k\\in\\mathbb Z',
          why: 'Par périodicité, chaque angle solution θ de [0, 2π[ donne les solutions θ + 2kπ, avec k entier. Réciproquement, tout réel se ramène à un unique angle de [0, 2π[ modulo 2π : aucune solution n’est omise.',
          phase: 'Retrouver tous les tours',
          statement: true,
        },
        {
          title: 'Retenir le résultat',
          tex: 'x=\\tfrac\\pi6+2k\\pi\\;\\text{ou}\\;\\tfrac{5\\pi}6+2k\\pi,\\quad k\\in\\mathbb Z',
          why: 'k est un entier quelconque, positif, nul ou négatif. Cette écriture contient toutes les solutions, sur tous les tours.',
          phase: 'Conclusion',
          statement: true,
        },
      ],
      visual: 'trig',
    },
  ],
  color: 'sage',
} satisfies Exercise;
