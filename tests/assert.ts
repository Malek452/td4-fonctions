import assert from 'node:assert/strict';
/** Small assertion vocabulary shared by the math and DOM checks. Each matcher
 * delegates to Node's strict assertions; no result is swallowed. */
export function expect(actual: unknown, message?: string) {
  const matchers = (negated = false) => {
    const check = (condition: boolean) => assert.ok(negated ? !condition : condition, message);
    return {
      get not() {
        return matchers(!negated);
      },
      toBe(expected: unknown) {
        check(Object.is(actual, expected));
      },
      toEqual(expected: unknown) {
        if (negated) assert.notDeepStrictEqual(actual, expected, message);
        else assert.deepStrictEqual(actual, expected, message);
      },
      toHaveLength(n: number) {
        check((actual as { length: number }).length === n);
      },
      toBeTruthy() {
        check(!!actual);
      },
      toBeNull() {
        check(actual === null);
      },
      toBeLessThan(n: number) {
        check(Number(actual) < n);
      },
      toBeGreaterThanOrEqual(n: number) {
        check(Number(actual) >= n);
      },
      toBeCloseTo(n: number, digits = 2) {
        check(Math.abs(Number(actual) - n) < Math.pow(10, -digits) / 2);
      },
      toContain(value: string) {
        check(String(actual).includes(value));
      },
      toMatch(value: RegExp) {
        check(value.test(String(actual)));
      },
      toThrow() {
        if (negated) assert.doesNotThrow(actual as () => unknown, message);
        else assert.throws(actual as () => unknown, message);
      },
    };
  };
  return matchers();
}
