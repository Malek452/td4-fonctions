# Semantic animation recipes

Keep the expression on one board. Highlight the operands before moving them. Preserve unrelated terms. Establish a new `phase` and use `statement: true` when introducing a new claim, rather than morphing unrelated formulas into each other.

The complete executable recipes are `powers.ts`, `algebra.ts`, `signs.ts` and `circle.ts` in `examples/`. The fragments below describe cues on a current step; its `fromFocus` refers to the immediately preceding step.

## Common-base powers

Given a previous expression `10^2\times10^3`, the next step can be:

```ts
{
  title: 'Additionner les exposants',
  tex: '10^{2+3}',
  why: 'Dans ce produit de puissances de même base, on garde 10 et on additionne 2 et 3.',
  fromFocus: String.raw`10^2\times10^3`,
  focus: '2+3',
  power: {kind:'product', base:'10', left:'2', right:'3', to:'10^{2+3}'},
}
```

`kind: 'quotient'` subtracts the denominator exponent; `kind: 'power'` multiplies nested exponents. The cue does not establish their conditions of validity. For general real exponents, a positive base is sufficient; state relevant domain restrictions in the lesson. `targetLeft`/`targetRight` can specify destination exponents when extra parentheses are needed. Do not silently reorder or drop exponent terms.

## Distribution, one factor at a time

For a previous `x(x-1)`, write the products first:

```ts
{
  title: 'Distribuer x',
  tex: String.raw`x\cdot x+x\cdot(-1)`,
  why: 'Le facteur x multiplie chacun des deux termes de la parenthèse.',
  fromFocus: 'x(x-1)',
  distribute: {
    factor:'x', term:'x', product:String.raw`x\cdot x`,
    remainder:String.raw`x\cdot(-1)`,
  },
}
```

The common factor is copied to the first term while remaining attached to the rest. For a factor on the right, set `side: 'right'`. `product` and `remainder` must be exact parts of the destination expression. Use subsequent steps to evaluate each product. The `expandBinomial` example shows this in a complete surrounding polynomial.

## One multiplication

On the step after `x\cdot x+x\cdot(-1)`, use `tex: 'x^2+x\\cdot(-1)'`, `fromFocus: 'x\\cdot x'`, `focus: 'x^2'` and:

```ts
product: {left:'x', right:'x', result:'x^2'}
```

The two selected operands are shown together, then replaced by their product before returning to the complete expression. The source selection must contain both factors. Signs are part of the selected operands; do not leave a negative sign behind.

## Collect like terms

For a previous `x^2-x+2x-2`, use `tex: 'x^2+x-2'`, `fromFocus: '-x+2x'`, `focus: 'x'` and:

```ts
collect: {left:'-x', right:'2x', via:'(-1+2)x', result:'x'}
```

`via` explicitly shows the coefficient operation. This distinguishes collection from multiplying the terms. The worked binomial helper also handles repeated occurrences in surrounding equations.

## Statement transitions

Introducing `x_1=(-b-\sqrt{\Delta})/(2a)` after computing a discriminant is a new formula, not an equality transformation of Δ. Mark the formula step `statement: true`, name the root-calculation phase, and explain the conditions `a ≠ 0` and `Δ > 0`. Only subsequent substitutions are transformations of that formula.

## Diagrams

- The `circle` field adds the unit circle, radius and projection. For example, use `angle: Math.PI/6`, `label: '\\sin(\\pi/6)=1/2'`, and `axis: 'sin'`. The angle is in radians. Set `axis: 'cos'` for the horizontal coordinate. Author the equation and conclusion separately.
- `table` uses the accessible HTML sign-table renderer; see `docs/AUTHORING.md`. Entries arrive along their row and the solution intervals are selected afterward.
- `diagram: 'fold'` retains the original rectangle-folding illustration. It is a specific schematic, not a general geometry system. It uses the label for the long side `b`; do not claim it represents arbitrary dimensions or a proof of a new geometric statement.
- `textStep` uses a short positional transition for readable paragraphs. It does not imply a mathematical equivalence between text blocks.

## Helper limits

`expandBinomial(wrap, p, q)` generates `(x+p)(x+q)` only for safe positive integer `p`, negative integer `q`, and `p+q ≠ 0`. `wrap` must include its argument unchanged once. It writes distribution, then individual products, then collection. Other signs, cancellation to zero, or different variables should be authored explicitly or implemented with their own verified helper.

`quadraticSteps({a,b,c,roots})` supports integer coefficients, `a ≠ 0`, and positive integer Δ no greater than 1,000,000. The two reviewed exact root strings are supplied in **minus-formula / plus-formula order**, not necessarily increasing order when `a < 0`. The helper builds formulas and arithmetic; it does not independently verify your supplied roots. Cases Δ = 0 and Δ < 0 need explicit lessons. `discriminantSteps` alone supports those cases with safe integer coefficients.

## Timing contract

`motion/timing.ts` defines one slot per step. `motion/step-clock.ts` schedules absolute boundaries so many sequential operations do not accumulate fractional-frame drift. `motion/player.ts` coordinates seeks/replays through `motion/playback-controller.ts`. A replay arms its end boundary only after the requested starting frame has actually rendered, so a stale frame from an asynchronous speed recalculation cannot stop it prematurely. Direct jumps and backward navigation settle a step; forward adjacent navigation and replay run the authored transition. Speed changes affect playback without restarting the expression.

Do not shorten a slot, add an unbounded wait, or replace absolute scheduling without updating and running `tests/timing.test.ts`. Test long sequences at every supported speed, then inspect actual browser playback: passing geometry tests alone cannot establish a good visual explanation.

## The same operation on both members

`balance` expresses addition, subtraction, multiplication or division as an operation on **both** members. It generates the full intermediate formula before reducing either member. It does not animate a term magically crossing the relation.

```ts
{
  title: 'Diviser les deux membres par −2',
  tex: String.raw`x>3`,
  why: 'Diviser par −2, strictement négatif, inverse le sens de l’inégalité.',
  fromFocus: String.raw`-2x<-6`,
  focus: String.raw`x>3`,
  balance: {
    operation: 'divide', operand: '-2', left: '-2x', right: '-6',
    relation: '<', toLeft: 'x', toRight: '3',
    condition: '-2<0', sign: 'negative',
  },
}
```

The generated intermediate is `\frac{-2x}{-2}>\frac{-6}{-2}`. Complete source members are retained as distinct groups. Two copies of the same operand enter the corresponding slots. Each reduced member is then displayed below its intermediate and returns to the main line. The condition remains visible throughout.

`relation` accepts `=`, `<`, `>`, `\le`, `\ge`, `\leq`, `\geq`. Multiplication/division requires an explicit `condition`; an inequality also requires `sign: 'positive'` or `'negative'`. A negative multiplier/divisor automatically reverses the relation. State the actual nonzero or sign hypothesis; it is authored mathematics, not inferred by the renderer. `left`, `right`, `toLeft`, `toRight` are exact expressions in the previous/current selected relation. Surrounding context must stay identical, apart from whitespace. Thus one equation in a disjunction can be transformed while preserving the other equation.

## A justified local simplification

```ts
{
  title: 'Simplifier le produit par un quotient',
  tex: String.raw`t^2-2-t=0`,
  why: 'Comme t > 0, t est non nul ; le facteur t se simplifie avec le dénominateur t.',
  fromFocus: String.raw`+t\cdot\left(-\frac2t\right)`,
  focus: '-2',
  simplify: {
    source: String.raw`+t\cdot\left(-\frac2t\right)`, result: '-2',
    rule: 'Simplifier le facteur commun non nul', condition: String.raw`t>0\Rightarrow t\ne0`,
    cancel: { factor: 't', quotient: String.raw`\frac2t` },
  },
}
```

`source` is copied into a short calculation line. The explicit equality `source = result` appears under the named rule, then the complete result returns to the exact replacement slot. The surrounding expression cannot change. Use a brief, precise French `rule`; use `condition` for a mathematical hypothesis. Do not supply an entire equation as the source of a simplification: the calculation line proves an equality of expressions, not an equality between equations.

Optional cancellation marks have a deliberately narrow grammar: a single-letter factor or a simple exponential such as `e^x` multiplying a quotient whose denominator is exactly that factor, with a required nonzero condition. An exponential denominator must be braced, as in `\frac2{e^x}`. `\cdot` and `\times`, outer signs and signed parentheses are supported. The compiler rejects sums in place of the product, different denominators, or absent conditions. It never strikes out additive terms or the names of inverse functions. The numerator and all signs remain untouched.

For distribution, `remainingTerm` optionally names the exact remaining sum in both source and destination. Its whole glyph group, including all minus signs, is retained independently while the original common factor and its copy move to the two products. Split a sum of three terms into two such distributions, before evaluating the products.

New operational animations reserve at most 6.75 seconds, plus the 0.25-second source selection, in the unchanged ten-second absolute slot. Calculation lines and hypotheses occupy separate bounded vertical regions so fraction bars, results and conditions remain legible.
