import { it } from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import type { Exercise, Step } from '../src/types';
import { definePresentation } from '../src/content/define';
import { balancePlan, simplifyPlan } from '../motion/operational-plan';
import { semanticRanges, type Range } from '../motion/semantic-ranges';

const t = String.raw;
const roleText = (tex: string, ranges: Range[], tag: string) => {
  const matches = ranges.filter((range) => range.tag === tag);
  assert.equal(matches.length, 1, `exactly one authored ${tag} role`);
  return tex.slice(matches[0].start, matches[0].end);
};
const step = (tex: string, fromFocus: string, balance: NonNullable<Step['balance']>): Step => ({
  title: 'Transformer les deux membres',
  tex,
  why: 'La même opération conserve une relation équivalente sous les hypothèses annoncées.',
  fromFocus,
  focus: tex,
  balance,
});
const dividePositive = () =>
  step('0<x', '0<2x', {
    operation: 'divide',
    operand: '2',
    left: '0',
    relation: '<',
    right: '2x',
    toLeft: '0',
    toRight: 'x',
    condition: '2>0',
    sign: 'positive',
  });
const deck = (current: Step): Exercise[] => [
  {
    id: 1,
    title: 'Opérations',
    short: 'Opérations',
    theme: 'Algèbre',
    level: 'TD',
    minutes: 5,
    objectives: [],
    prerequisites: [],
    description: 'Régression',
    color: '',
    activities: [
      {
        id: 'operation-test',
        label: 'Une transformation',
        prompt: 'Résoudre',
        tex: current.fromFocus || '0<2x',
        result: current.tex,
        visual: 'algebra',
        steps: [
          { title: 'Énoncé', tex: current.fromFocus || '0<2x', why: 'Relation à transformer.' },
          current,
        ],
      },
    ],
  },
];

it('division by a positive number keeps the inequality and exposes both quotients', () => {
  const plan = balancePlan('0<2x', dividePositive());
  assert.equal(plan.destinationRelation, '<');
  assert.equal(plan.intermediate.tex, t`\frac{0}{2}<\frac{2x}{2}`);
  for (const side of ['Left', 'Right'])
    assert.equal(roleText(plan.intermediate.tex, plan.intermediate.ranges, `operand${side}`), '2');
  assert.equal(roleText(plan.intermediate.tex, plan.intermediate.ranges, 'memberLeft'), '0');
  assert.equal(roleText(plan.intermediate.tex, plan.intermediate.ranges, 'memberRight'), '2x');
  katex.renderToString(plan.intermediate.tex, { throwOnError: true, strict: 'error' });
});

it('division by a negative number reverses the inequality before simplifying either member', () => {
  const current = step(t`x\geq-2`, t`-2x\leq4`, {
    operation: 'divide',
    operand: '-2',
    left: '-2x',
    relation: t`\leq`,
    right: '4',
    toLeft: 'x',
    toRight: '-2',
    condition: '-2<0',
    sign: 'negative',
  });
  const plan = balancePlan(t`-2x\leq4`, current);
  assert.equal(plan.destinationRelation, t`\geq`);
  assert.equal(plan.intermediate.tex, t`\frac{-2x}{-2}\geq\frac{4}{-2}`);
  assert.equal(roleText(plan.intermediate.tex, plan.intermediate.ranges, 'relation'), t`\geq`);
  assert.equal(roleText(current.tex, plan.target, 'memberRight'), '-2');
  assert.throws(
    () => balancePlan(t`-2x\leq4`, { ...current, tex: t`x\leq-2`, focus: t`x\leq-2` }),
    /Missing relation/,
  );
  katex.renderToString(plan.intermediate.tex, { throwOnError: true, strict: 'error' });
});

it('addition and subtraction act on both complete members, including their signs', () => {
  for (const operation of ['add', 'subtract'] as const) {
    const adding = operation === 'add';
    const source = adding ? 'x-3=2' : 'x+3=7';
    const current = step(adding ? 'x=5' : 'x=4', source, {
      operation,
      operand: '3',
      left: adding ? 'x-3' : 'x+3',
      right: adding ? '2' : '7',
      relation: '=',
      toLeft: 'x',
      toRight: adding ? '5' : '4',
    });
    const plan = balancePlan(source, current);
    assert.equal(plan.destinationRelation, '=');
    assert.equal(
      plan.intermediate.tex,
      adding
        ? t`\left(x-3\right)+\left(3\right)=\left(2\right)+\left(3\right)`
        : t`\left(x+3\right)-\left(3\right)=\left(7\right)-\left(3\right)`,
    );
    for (const side of ['Left', 'Right'])
      assert.equal(
        roleText(plan.intermediate.tex, plan.intermediate.ranges, `operand${side}`),
        '3',
      );
    katex.renderToString(plan.intermediate.tex, { throwOnError: true, strict: 'error' });
  }
});

it('multiplication preserves the whole rational member until distribution is a separate step', () => {
  const source = t`t-\frac2t-1=0`;
  const current = step(t`t\left(t-\frac2t-1\right)=0`, source, {
    operation: 'multiply',
    operand: 't',
    left: t`t-\frac2t-1`,
    relation: '=',
    right: '0',
    toLeft: t`t\left(t-\frac2t-1\right)`,
    toRight: '0',
    condition: 't>0',
    sign: 'positive',
  });
  const plan = balancePlan(source, current);
  assert.equal(
    roleText(plan.intermediate.tex, plan.intermediate.ranges, 'memberLeft'),
    t`t-\frac2t-1`,
  );
  assert.equal(roleText(plan.intermediate.tex, plan.intermediate.ranges, 'operandLeft'), 't');
  assert.equal(roleText(plan.intermediate.tex, plan.intermediate.ranges, 'operandRight'), 't');
  katex.renderToString(plan.intermediate.tex, { throwOnError: true, strict: 'error' });
});

it('a repeated relation uses the selected occurrence and keeps the other equation untouched', () => {
  const previous = t`a:\;2x=4,\quad b:\;2x=4`;
  const current = step(t`a:\;2x=4,\quad b:\;x=2`, '2x=4', {
    operation: 'divide',
    operand: '2',
    left: '2x',
    relation: '=',
    right: '4',
    toLeft: 'x',
    toRight: '2',
    condition: t`2\ne0`,
    sign: 'nonzero',
  });
  current.fromFocusOccurrence = 2;
  current.focus = 'x=2';
  const plan = balancePlan(previous, current);
  assert.equal(
    plan.source.find((range) => range.tag === 'memberLeft')!.start,
    previous.lastIndexOf('2x'),
  );
  assert.equal(plan.intermediate.tex, t`a:\;2x=4,\quad b:\;\frac{2x}{2}=\frac{4}{2}`);
  assert.equal(roleText(current.tex, plan.target, 'memberLeft'), 'x');
  assert.throws(() => balancePlan(previous, { ...current, fromFocus: '2x' }), /escapes|Missing/);
});

it('a local simplification displays a justified equality and preserves surrounding terms', () => {
  const previous = t`u+\frac{2t}{t}+v`;
  const current: Step = {
    title: 'Simplifier le quotient',
    tex: 'u+2+v',
    why: 'Le facteur t est non nul.',
    fromFocus: t`\frac{2t}{t}`,
    focus: '2',
    simplify: {
      source: t`\frac{2t}{t}`,
      result: '2',
      rule: 'Simplifier le facteur commun non nul',
      condition: t`t\ne0`,
    },
  };
  const plan = simplifyPlan(previous, current);
  assert.equal(plan.equality.tex, t`\frac{2t}{t}=2`);
  assert.equal(roleText(previous, plan.source, 'replacement'), t`\frac{2t}{t}`);
  assert.equal(roleText(current.tex, plan.target, 'result'), '2');
  assert.throws(
    () => simplifyPlan(previous, { ...current, tex: 'u+2-v' }),
    /preserve the surrounding expression/,
  );
  katex.renderToString(plan.equality.tex, { throwOnError: true, strict: 'error' });
});

it('simplification never consumes a command letter or another repeated occurrence', () => {
  const previous = t`t\times t+t`;
  const current: Step = {
    title: 'Remplacer la valeur sélectionnée',
    tex: t`t\times 2+t`,
    why: 'Dans cet exemple, t vaut 2.',
    fromFocus: 't',
    fromFocusOccurrence: 2,
    focus: '2',
    simplify: {
      source: 't',
      result: '2',
      rule: 'Substitution de la valeur connue',
      condition: 't=2',
    },
  };
  const plan = simplifyPlan(previous, current);
  assert.equal(
    plan.source.find((range) => range.tag === 'replacement')!.start,
    previous.indexOf(' t') + 1,
  );
  assert.equal(plan.equality.tex, 't=2');
});

it('distribution keeps the remaining negative terms together and copies only the common factor', () => {
  const previous = t`t\left(t-\frac2t-1\right)`;
  const current: Step = {
    title: 'Distribuer sur le premier terme',
    tex: t`t\cdot t+t\left(-\frac2t-1\right)`,
    why: 'Le facteur t multiplie le premier terme et la somme restante.',
    fromFocus: previous,
    distribute: {
      factor: 't',
      term: 't',
      product: t`t\cdot t`,
      remainder: t`t\left(-\frac2t-1\right)`,
      remainingTerm: t`-\frac2t-1`,
    },
  };
  const roles = semanticRanges(previous, current);
  assert.equal(roleText(previous, roles.source, 'remainingTerm'), t`-\frac2t-1`);
  assert.equal(roleText(current.tex, roles.target, 'remainingTerm'), t`-\frac2t-1`);
  assert.equal(roleText(current.tex, roles.target, 'factorCopy'), 't');
  assert.equal(roleText(current.tex, roles.target, 'factor'), 't');
  assert.equal(
    roles.target.find((range) => range.tag === 'factor')!.start,
    current.tex.indexOf('+t') + 1,
  );
});

it('structural validation rejects unsafe division and ambiguous operation cues', () => {
  const valid = dividePositive();
  assert.doesNotThrow(() => definePresentation(deck(valid)));
  for (const operand of ['0', '-0', '0.00']) {
    const invalid = structuredClone(valid);
    invalid.balance!.operand = operand;
    assert.throws(() => definePresentation(deck(invalid)), /nonzero operand/);
  }
  const noCondition = structuredClone(valid);
  delete noCondition.balance!.condition;
  assert.throws(() => definePresentation(deck(noCondition)), /requires its condition/);
  const unknownSign = structuredClone(valid);
  unknownSign.balance!.sign = 'nonzero';
  assert.throws(() => definePresentation(deck(unknownSign)), /requires the sign/);
  const ambiguous = structuredClone(valid);
  ambiguous.simplify = { source: '2x', result: 'x', rule: 'Une seconde opération' };
  assert.throws(() => definePresentation(deck(ambiguous)), /one semantic operation/);
  const statement = structuredClone(valid);
  statement.statement = true;
  assert.throws(() => definePresentation(deck(statement)), /unrelated statement/);
});

it('balance operations cannot change an unrelated equation outside their selected relation', () => {
  const previous = t`a=1,\quad 0<2x`;
  const current = dividePositive();
  current.tex = t`a=1,\quad 0<x`;
  current.focus = '0<x';
  assert.doesNotThrow(() => balancePlan(previous, current));
  assert.throws(
    () => balancePlan(previous, { ...current, tex: t`a=2,\quad 0<x` }),
    /preserve the surrounding expression/,
  );
});

it('cancellation marks only the external nonzero factor and its denominator, preserving the negative sign', () => {
  for (const quotient of [t`\frac2t`, t`\frac{2}{t}`]) {
    const source = t`+t\cdot\left(-${quotient}\right)`;
    const previous = t`t^2${source}-t=0`;
    const current: Step = {
      title: 'Simplifier le facteur t',
      tex: 't^2-2-t=0',
      why: 'Le facteur t est non nul, et le signe négatif reste attaché au numérateur.',
      fromFocus: source,
      focus: '-2',
      simplify: {
        source,
        result: '-2',
        rule: 'Simplifier le facteur commun non nul',
        condition: 't>0',
        cancel: { factor: 't', quotient },
      },
    };
    const plan = simplifyPlan(previous, current);
    assert.equal(roleText(previous, plan.source, 'cancelFactor'), 't');
    assert.equal(roleText(previous, plan.source, 'cancelDenominator'), 't');
    assert.equal(
      plan.source.find((r) => r.tag === 'cancelFactor')!.start,
      previous.indexOf('+t') + 1,
    );
    assert.equal(
      plan.source.find((r) => r.tag === 'cancelDenominator')!.start,
      previous.indexOf(quotient) + quotient.lastIndexOf('t'),
    );
    assert.equal(roleText(plan.equality.tex, plan.equality.ranges, 'cancelFactor'), 't');
    assert.equal(roleText(plan.equality.tex, plan.equality.ranges, 'cancelDenominator'), 't');
    assert.equal(roleText(current.tex, plan.target, 'result'), '-2');
    assert.equal(plan.equality.tex, `${source}=-2`);
    katex.renderToString(plan.equality.tex, { throwOnError: true, strict: 'error' });
  }
});

it('cancellation rejects additive terms, a different denominator and an unstated nonzero condition', () => {
  const attempt = (source: string, quotient: string, condition?: string): Step => ({
    title: 'Simplifier',
    tex: '2',
    why: 'Hypothèse de test.',
    fromFocus: source,
    focus: '2',
    simplify: {
      source,
      result: '2',
      rule: 'Simplifier un facteur',
      condition,
      cancel: { factor: 't', quotient },
    },
  });
  const sum = t`t+\frac2t`;
  assert.throws(
    () => simplifyPlan(sum, attempt(sum, t`\frac2t`, 't>0')),
    /product, never to additive terms/,
  );
  const denominator = t`t\cdot\frac2u`;
  assert.throws(
    () => simplifyPlan(denominator, attempt(denominator, t`\frac2u`, 't>0')),
    /denominator must be exactly the common factor/,
  );
  const product = t`t\cdot\frac2t`;
  assert.throws(
    () => simplifyPlan(product, attempt(product, t`\frac2t`)),
    /requires a nonzero condition/,
  );
});

it('exponential cancellation selects the complete two factors and leaves the numerator and context intact', () => {
  for (const quotient of [t`\frac2{e^x}`, t`\frac{2}{e^x}`]) {
    const source = t`+e^x\cdot\left(-${quotient}\right)`;
    const previous = t`(e^x)^2${source}-e^x=0`;
    const current: Step = {
      title: 'Simplifier par eˣ',
      tex: t`(e^x)^2-2-e^x=0`,
      why: 'L’exponentielle est strictement positive, donc non nulle.',
      fromFocus: source,
      focus: '-2',
      simplify: {
        source,
        result: '-2',
        rule: 'Simplifier par le facteur non nul eˣ',
        condition: t`e^x>0\Rightarrow e^x\ne0`,
        cancel: { factor: 'e^x', quotient },
      },
    };
    const plan = simplifyPlan(previous, current);
    for (const tag of ['cancelFactor', 'cancelDenominator']) {
      assert.equal(roleText(previous, plan.source, tag), 'e^x');
      assert.equal(roleText(plan.equality.tex, plan.equality.ranges, tag), 'e^x');
    }
    const external = plan.source.find((range) => range.tag === 'cancelFactor')!;
    const denominator = plan.source.find((range) => range.tag === 'cancelDenominator')!;
    assert.equal(external.start, previous.indexOf('+e^x') + 1);
    assert.equal(denominator.start, previous.indexOf(quotient) + quotient.lastIndexOf('e^x'));
    assert.ok(external.end < previous.indexOf(quotient), 'the numerator is not struck out');
    assert.ok(denominator.end < previous.lastIndexOf('-e^x'), 'the unrelated exponential remains');
    assert.equal(roleText(current.tex, plan.target, 'result'), '-2');
    assert.equal(plan.equality.tex, `${source}=-2`);
    katex.renderToString(plan.equality.tex, { throwOnError: true, strict: 'error' });
  }
});

it('exponential cancellation rejects sums, changed exponents, unbraced denominators and missing conditions', () => {
  const attempt = (source: string, quotient: string, condition?: string): Step => ({
    title: 'Simplifier',
    tex: '2',
    why: 'Hypothèse de test.',
    fromFocus: source,
    focus: '2',
    simplify: {
      source, result: '2', rule: 'Simplifier un facteur', condition,
      cancel: { factor: 'e^x', quotient },
    },
  });
  const sum = t`e^x+\frac2{e^x}`;
  assert.throws(() => simplifyPlan(sum, attempt(sum, t`\frac2{e^x}`, 'e^x>0')), /product, never to additive terms/);
  for (const quotient of [t`\frac2{e^y}`, t`\frac2{e^x+1}`, t`\frac2e^x`]) {
    const source = t`e^x\times${quotient}`;
    assert.throws(() => simplifyPlan(source, attempt(source, quotient, 'e^x>0')), /denominator must be exactly the common factor/);
  }
  const source = t`e^x\times\frac2{e^x}`;
  assert.throws(() => simplifyPlan(source, attempt(source, t`\frac2{e^x}`)), /requires a nonzero condition/);
});
