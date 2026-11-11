# Architecture and scope

## Source and rendering

The presentation is typed data in `src/content/`. `definePresentation` rejects duplicate identifiers, unsupported simultaneous surfaces/operations, invalid occurrence numbers and malformed sign tables. It does not calculate or prove the lesson.

`scripts/prepare-equations.mjs` bundles that data, tags exact TeX ranges and renders MathJax glyphs to SVG outlines. It stores shared paths and positioned glyphs in `motion/generated/equations.json`. This step checks that a selected factor, exponent or result actually exists in the relevant expression.

The Motion Canvas Vite pipeline compiles `motion/player.ts`, its scene and glyph data into fingerprinted static files under `public/animations/`. The React Vite pipeline reads that manifest and loads the correct player on demand. React manages navigation, the live explanation, accessible controls and reduced-motion fallback. KaTeX displays accessible/static formulas and the printable handout. No runtime MathJax service or font CDN is used.

`npm run build` also writes `public/handout/`, then copies the finished assets into `dist/`. Generated files are ignored by Git and recreated in CI. A fresh clone must install and build before previewing.

## Main files

| Area | Files |
| --- | --- |
| Content and contract | `src/types.ts`, `src/content/define.ts`, `src/content/index.ts` |
| Configuration and palette | `presentation.config.ts`, `src/theme.ts`, `src/ui.ts` |
| Reader | `src/App.tsx`, `src/components/Lesson.tsx`, `src/route.ts` |
| Rendering bridge | `src/components/Animation.tsx`, `motion/player.ts` |
| Math choreography | `motion/lesson.ts`, `motion/operations.ts`, `motion/semantic-operations.ts` |
| Glyph selection/geometry | `motion/semantic-ranges.ts`, `motion/geometry.ts`, `scripts/math-svg.mjs` |
| Scheduling | `motion/timing.ts`, `motion/step-clock.ts` |
| Tables, text and gestures | `src/components/SignTable.tsx`, `ProseSlide.tsx`, `useStepSwipe.ts` |
| Development and exports | `scripts/dev.mjs`, `scripts/export-docs.mjs`, `scripts/new-lesson.mjs` |

## Extending the engine

For ordinary lessons, author data. For a genuinely new visualization, define a typed cue, validate its data, implement a renderer and settled state, then add timing/geometry/interaction checks as appropriate. Verify reduced motion and screen-reader fallback. Keep scene JSX separate from React JSX.

The optional `npm run motion` command opens the Motion Canvas editor for engine authors, after equation preparation. Students never need it. Their app uses the custom scene controller, not an embedded video or the full editor.

## Limits

- This is a code-authored template, not a visual slide editor or automatic PDF converter.
- There is no arbitrary reasoning validator, student response engine or progress tracking.
- Existing choreography supports the semantic operations documented in `ANIMATIONS.md`; unsupported mathematical structures need explicit steps or new code.
- Text slides are plain paragraphs. Images, arbitrary diagrams, narration, drag-and-drop authoring and video export are not exposed as presentation features.
- KaTeX and MathJax support overlapping TeX subsets; render-check newly introduced commands. Unsupported/unmatched glyph references stop the build.
- A long formula fits the shared board by scaling. This cannot make an arbitrarily dense formula readable on a phone: split it into focused steps and inspect it at the intended size. Wide sign tables scroll horizontally.
- Known dependency compatibility constraints are recorded in `MAINTENANCE.md`.

## Provenance

The engine and visual language were extracted from `Malek452/atelier-fonctions`, commit `c557622389366858f7505217774e0065b8574313`. This starter retains selected representative, reviewed examples, not the original PDF or the full course. The source application remains a separate repository. New authoring/configuration/docs and tests belong to this starter.
