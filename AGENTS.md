# Instructions for coding assistants

This is a reusable **presentation** repository. Read `README.md`, `docs/AUTHORING.md` and `docs/ANIMATIONS.md` before authoring content. Follow the user's language and audience; bundled examples and authoring helpers are French.

## Preserve the experience

- One main board, one current step and its matching justification. Keep navigation compact. Do not add promotional copy, dashboards, student answer fields, grading or accounts unless requested.
- Preserve the existing theme, keyboard/swipe navigation, reduced motion, replay and speed controls. Prefer `src/theme.ts` for palette changes.
- Edit `src/content/`, `presentation.config.ts` and the content registry for a new presentation. Reuse the engine before changing it.
- Keep `examples/` as reusable recipes and independent test fixtures. Remove its imports from the active registry to replace the demo; unregistered examples are not shipped to the student app. Generic content/geometry checks run on the active registry, while sample mathematical/UI regressions use those fixtures.
- `visual` is descriptive metadata; it does not magically create a diagram. Use an implemented `circle`, `table`, `diagram` or a deliberate new renderer.

## Mathematical and pedagogical contract

- Read the supplied material fully. Do not invent missing statements, data, solutions or source references. Identify ambiguities.
- Solve each exercise independently. State domains and the conditions for each theorem or transformation. Distinguish equivalence from implication, equality from approximation, and a zero from an undefined value.
- Write an explanation of **why this exact step is valid** in `why`. Avoid vague translations such as “conditions utiles”; use precise French such as “conditions d’existence”, “valeurs interdites” or “hypothèses”, as appropriate.
- Use one operation per step for a novice audience. Write distribution before computing the products. Compute each product separately before collecting like terms.
- A new formula, hypothesis, diagram or subproblem is not an algebraic rewrite of the preceding result. Set `statement: true` when that boundary matters and name the new `phase`.
- Prefer `String.raw` for TeX. A single backslash in an ordinary JavaScript string can corrupt `\frac`, `\times`, `\infty`, etc.
- All `focus`, `fromFocus`, operation factors and results must be exact substrings of the correct expression. Occurrence numbers start at one. Preserve signs and surrounding terms.
- Use semantic `power`, `distribute`, `product` and `collect` cues. Do not replace these with blanket fades or arbitrary glyph matching. Keep common bases fixed while exponents move. Highlight before moving.
- Use French sign tables with ordered critical values, zeros, forbidden-value double bars and explicit endpoint inclusion. Table data does not calculate signs for you.
- `textStep` is for short plain-text slides, not HTML or Markdown. Do not cram a page of text into the board.

## Implementation boundaries

- `definePresentation` checks structure; the equation compiler checks renderability and references. Neither proves the mathematics of arbitrary author content.
- `expandBinomial` and `quadraticSteps` have documented restricted domains. Do not stretch them to cases they cannot represent. The exact roots supplied to the quadratic helper must be independently verified.
- Keep activity IDs unique and stable: links depend on them. Numeric section IDs must also be unique.
- Do not manually edit generated `motion/generated/`, `public/animations/`, `public/handout/` or `dist/`. Build them.
- React and Motion Canvas have separate compilation paths. Do not feed scene files to React's JSX transform.
- The Motion Canvas timeline uses absolute step boundaries to prevent accumulated frame drift. Preserve `motion/step-clock.ts`, the seek/replay contract and the timing regression when changing animation code.
- Do not silently bypass dependency peer constraints or add force-install flags. Read `docs/MAINTENANCE.md` before dependency changes.
- No secrets belong in this static client. Do not add a backend or paid runtime API for ordinary presentations.

## Complete the work

1. Review the mathematics and prose, including hypotheses, all branches and endpoints.
2. Add or adjust meaningful regression checks for new mathematical content or engine behavior. Technical tests alone do not certify a lesson.
3. Run `npm run validate` with Node 24. Fix failures; do not suppress checks to make the build pass.
4. Inspect relevant transitions in a browser: beginning, moving terms, end, replay, backward/jump, slow speed, reduced motion and a narrow screen. Check that the explanation matches the current operation.
5. Report which commands and visual checks actually ran, and any remaining limitations. Never claim an unexecuted check passed.

Deploy only `dist/`. The development server and Motion Canvas editor are author tools. Follow the user's publishing instructions; do not modify unrelated repositories or presentations.
