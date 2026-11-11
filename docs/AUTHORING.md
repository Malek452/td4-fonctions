# Author a presentation

The content hierarchy is **section → activity → step**. `Exercise` is the historical TypeScript name for a section; it can represent a chapter or topic. A reader sees the section/activity selectors, the current step, its justification and the playback controls.

## Fastest route

```sh
npm run new:lesson -- fractions "Fractions"
```

The command adds one typed content file and its import/entry in `src/content/index.ts`. It refuses existing files and duplicate IDs. Keep the two `@new-lesson-*` comments in that registry if you want the command to keep working. Replace the generated equation example with your lesson.

To remove the starter lessons from the presentation, remove their imports and array entries from `src/content/index.ts`. Keep at least one section/activity. IDs need not be consecutive. Leave `examples/` in the repository: it supplies reference recipes and independent regression fixtures, but unregistered examples are not bundled into the student app. Put your own lessons in `src/content/`.

## Content contract

| Object | Required fields | Meaning |
| --- | --- | --- |
| Section (`Exercise`) | `id`, `title`, `short`, `theme`, `level`, `minutes`, `objectives`, `prerequisites`, `description`, `color`, `activities` | Positive unique integer ID; `short` is the navigation label. The remaining teaching metadata is available to authors/exports; it does not create extra screen panels. `color` is legacy metadata, not a palette override. |
| Activity | `id`, `label`, `prompt`, `tex`, `result`, `visual`, `steps` | Stable URL-safe ID, navigation label, statement/result metadata and ordered steps. The board renders `steps`, not the top-level `tex` or `result`. |
| Step | `title`, `tex`, `why` | Heading, complete current expression, and the justification shown underneath it. |

See `src/types.ts` for optional activity metadata and every animation field. `visual` is a descriptive category, not a renderer switch. Updating `result` alone does not update the displayed conclusion: author the final step too.

Use `String.raw` for TeX:

```ts
const t = String.raw;
const step = {
  title: 'Diviser les deux membres par 2',
  tex: t`x=\frac{6}{2}`,
  why: 'On divise les deux membres de 2x = 6 par le même nombre non nul, 2.',
  focus: t`\frac{6}{2}`,
};
```

This step needs a preceding `2x=6` step. Always write the entire expression in `tex`; cues describe its transition from the preceding step.

## Boundaries and highlights

- `phase` names a part of the reasoning and remains visible until another phase is named.
- `statement: true` introduces a new statement rather than claiming an algebraic transformation of the previous expression. Use it for a new formula, hypothesis, diagram or separate calculation.
- `focus` highlights an exact substring in the current `tex`.
- `fromFocus` highlights an exact substring of the **previous step** before the operation.
- `focusOccurrence` and `fromFocusOccurrence` are one-based when a fragment occurs more than once.

Without an explicit focus the last top-level equality member is selected, or the complete expression when there is no equality. Avoid selecting half a TeX command or unbalanced groups. The compiler fails on invalid/missing references rather than silently guessing.

There can be at most one semantic operation (`power`, `distribute`, `product`, `collect`) per step. The first step cannot transform a nonexistent previous expression. A text, sign-table, unit-circle or folding surface cannot also contain a semantic algebra operation.

## Plain-text presentations

```ts
import {textStep} from './define';
const steps = [
  textStep('Définir une proportion', [
    'Une proportion compare une partie à l’ensemble auquel elle appartient.',
    'L’effectif total doit être non nul.',
  ], 'Cette condition permet de diviser par l’effectif total.', 'Définition'),
];
```

`textStep` produces a valid `Step`, sets `statement: true`, and displays plain paragraphs on the same board. HTML and Markdown are not interpreted. Keep paragraphs short and split long explanations into steps. The handout prints the paragraphs, not the internal TeX placeholder. Mathematical and text slides can coexist within an activity.

## Sign tables

`examples/signs.ts` is a complete worked example. Define sorted finite critical values and one row per factor, then the final expression. Each row needs one sign per open interval (`points.length + 1`) and one marker per critical value (`''`, `'0'`, or `'bar'`).

Call `signTableSteps(model, explanations, selectedIntervals, selectedPoints, reading)` to reveal the header, each justified row, and the solution selection. Interval and point indices start at zero. A selected endpoint must not be forbidden on the final row. Write the final interval set explicitly and check the endpoint brackets yourself.

The model is authored data: no sign inference, polynomial solver or inequality prover runs at presentation time. Negative and positive infinity are rendered as `\infty`, and never inserted as finite critical points.

## Theme, language and sharing

Edit `src/theme.ts` to change colors; use consistent roles for an active term, a second operand and a retained base. Check contrast on both the board and controls. Layout styles are in `src/styles.css`.

Set `presentation.locale` to `fr` or `en` for controls. Author lesson text in the desired language. French helpers return French explanations, even if the controls are English.

Link directly to an activity with `#activity/ACTIVITY_ID`. Keep IDs unchanged when reordering. Older `#exercice-N-M` links are accepted for imported content but are order-dependent. Steps are not individually encoded in the URL.

## Before sharing

Run `npm run validate`, then inspect the relevant animations in a browser. Check hypotheses, exact results, signs, intervals and each justification. Review both the normal animation and reduced-motion result. The generated handout is useful for a complete text/math review.

Structural/build checks cannot certify arbitrary mathematics. For a new lesson, supplement the review with independent calculations or targeted symbolic/numerical tests where appropriate. A sampled numeric agreement alone is not a proof of an identity.
