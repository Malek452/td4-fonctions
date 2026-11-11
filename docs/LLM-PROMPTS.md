# Prompts for coding assistants

Use an assistant that can read and edit this repository, install dependencies, and run commands. These prompts do not require a particular vendor, paid API or chat integration in the presentation itself.

## Adapt the template to a course

```text
Read AGENTS.md, README.md, docs/AUTHORING.md and docs/ANIMATIONS.md first.

Adapt this template to the attached teaching material for [audience], in
[language], for [duration]. Preserve the existing single-board theme,
Motion Canvas animation engine, controls, reduced motion and static hosting.

Read the entire supplied document. Identify every activity, prerequisite and
ambiguity. Solve the exercises independently and verify the answers. Do not
invent missing data. Flag a genuinely blocking ambiguity before filling it in.

Write the presentation in src/content/, configure presentation.config.ts and
register it in src/content/index.ts. Use one operation per step for beginners,
exact source/target highlights, semantic animations and explicit phase
boundaries. Explain why each transformation is valid. Remove the example
lessons from the registry when the replacement is complete.

Do not add quizzes, answer checking, accounts or a dashboard. Do not change
the engine just to author ordinary content. Use the existing helper functions
only within their documented supported cases.

Add meaningful checks for the new mathematics. Run npm run validate and fix
errors. Inspect the presentation in the browser, including the moving terms,
replay, backwards navigation, reduced motion and a narrow screen. Report what
was actually tested, any limitations, and the files an author should edit next.
```

## Add one lesson

```text
Read AGENTS.md. Add an activity about [topic] for [audience] using the existing
theme and animation framework. Run npm run new:lesson -- [slug] "[Title]" to
create its starting file, then replace the sample equation with the real lesson.

Keep current activities and their stable IDs. For every step, write a precise
justification. Distinguish a new statement from an algebraic rewrite. Use
semantic cues only where the actual operation warrants them. Check the math,
run npm run validate, and inspect the affected transitions before finishing.
```

## Audit the teaching logic

```text
Review [activity ID] in this repository. Read AGENTS.md and inspect its source,
generated handout and actual browser playback. Verify domains, equivalence
versus implication, signs, endpoints, root formulas and conclusions. Check
that the explanation matches the displayed step while the animation runs.

Preserve smooth timing and the single-board layout. Fix only substantiated
mathematical, wording or semantic-animation problems. Re-run the affected
regressions and the production build. Report the exact changes and checks.
```

Give the assistant source files rather than an inaccessible filename. A prompt cannot compensate for a missing worksheet. If the assistant cannot run a browser or commands, ask it to state that limitation and provide a reviewable change without claiming execution.
