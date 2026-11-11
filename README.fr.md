# TD 4 — Fonctions, exponentielles et trigonométrie

Présentation interactive en français de la « Feuille TD no 4 » de Mathématiques 1 (EC 101-1-17, 2026–2027), F. Marotte.

[Ouvrir la présentation](https://malek452.github.io/td4-fonctions/) · [Corrigé imprimable](https://malek452.github.io/td4-fonctions/handout/)

## Les sept exercices

1. Simplifier trois expressions logarithmiques et exponentielles ; comparer le domaine de l’expression initiale et le domaine maximal de la formule simplifiée.
2. Déterminer le domaine de définition, les zéros et la parité de deux fonctions.
3. Démontrer deux identités exponentielles en justifiant les transformations de quotients.
4. Résoudre une équation exponentielle par multiplication par un facteur non nul, développement et réduction.
5. Résoudre une inéquation trigonométrique sur [−π ; π], en incluant les bornes d’égalité.
6. Résoudre une égalité de sinus : deux familles de solutions, sélection des entiers et suppression des doublons.
7. Transformer une combinaison de cosinus et sinus à l’aide de la formule d’addition, puis résoudre dans [0 ; 2π[.

Chaque calcul est accompagné de sa justification. Les conditions d’existence, les domaines de définition, les équivalences et les ensembles de solutions sont distingués. La simplification d’une formule n’élargit pas automatiquement le domaine de la fonction initiale.

## Une présentation pas à pas

Le tableau central montre une étape à la fois. Les animations représentent les opérations : distribution d’un facteur sur chaque terme, calcul séparé des produits, réduction des termes semblables, même opération dans les deux membres, simplification locale avec ses conditions. Une nouvelle formule ou une hypothèse est présentée comme un nouvel énoncé.

Des droites graduées comparent les domaines. Les courbes illustrent la parité après sa démonstration. Les cercles trigonométriques relient les ordonnées, les angles, les familles périodiques et les intervalles de résolution. Les figures sont redessinées en SVG ; elles complètent les preuves.

Le fond clair, les contrastes élevés et les traits épais reprennent la présentation du TD 3 pour la lecture à l’écran et la projection. Les légendes et les marqueurs inclus/exclus donnent aussi l’information sans dépendre uniquement de la couleur.

## Utilisation

- Choisir un exercice, puis une question.
- Avancer avec les flèches du clavier, les boutons ou un glissement horizontal sur téléphone.
- Utiliser le menu des étapes pour revenir à un domaine, une formule ou une conclusion.
- Rejouer une transformation et régler sa vitesse ; réduire les animations si nécessaire.
- Passer en plein écran pour la projection.
- Ouvrir `handout/` pour le corrigé complet ; l’impression du navigateur permet de l’enregistrer en PDF.

Les liens d’activité sont stables, par exemple `#activity/td4-1c` et `#activity/td4-6`. Aucun compte étudiant ni collecte de réponses.

## Développement et vérification

Dépôt indépendant [Malek452/td4-fonctions](https://github.com/Malek452/td4-fonctions), adapté du moteur de [TD 3](https://github.com/Malek452/td3-fonctions) et du modèle [Atelier Présentations](https://github.com/Malek452/atelier-presentations). Le TD 3 conserve son dépôt et son déploiement.

Node.js 24 est requis.

```sh
npm ci
npm run validate
npm run dev
```

`npm run validate` vérifie les références TeX et les opérations, les géométries, les interactions, les régressions mathématiques propres au TD, puis construit le moteur d’animation, le corrigé imprimable et le site. Ces contrôles complètent une résolution indépendante et une relecture des justifications ; un test numérique isolé n’est pas une démonstration.

GitHub Pages publie uniquement `dist/`, dans un projet indépendant. Les sources pédagogiques sont dans `src/content/td4-*.ts` ; les figures propres au TD sont dans `src/components/TD4Graphs.tsx`. Ne pas modifier à la main les fichiers générés.

## Sources et attribution

- F. Marotte, « Feuille TD no 4 », Mathématiques 1, 2026–2027 : les sept énoncés fournis par l’enseignant.
- « Chapitre 3 – Limites et continuité », pages imprimées 29–42 : repères sur les fonctions de référence, domaines et égalités après simplification, notamment pages 32, 34 et 41. Le TD 4 ne demande pas de calcul de limites ; le chapitre sert de guide et ne remplace pas les énoncés.
- Modèle logiciel Atelier Présentations, licence MIT conservée dans `LICENSE`. Les droits sur les documents pédagogiques restent ceux de leurs auteurs. Les PDF sources ne sont pas republiés dans ce dépôt.
