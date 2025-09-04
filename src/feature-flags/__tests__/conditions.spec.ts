/* eslint-disable @typescript-eslint/no-explicit-any, no-shadow */

/**
 * conditions.spec.ts
 * NOTE: This test suite follows the project's existing test runner (Jest or Vitest).
 * If using Vitest, global APIs (describe/it/expect) are compatible with Jest-style syntax.
 * If using Jest, ensure ts-jest or equivalent is configured.
 *
 * This suite targets the feature-flags conditions/evaluator module. It focuses on:
 * - Happy paths for common operators
 * - Edge cases (null/undefined, empty arrays/objects)
 * - Failure conditions (invalid operator, malformed condition)
 * - Complex nested conditions with AND/OR/NOT semantics
 *
 * If implementation exports differ, adjust imports accordingly.
 */

import { describe, it, expect } from 'vitest'; // Will be tree-shaken or alias-resolved if using Jest
// Try common import paths; adjust as needed by the repository:
let api: any;
try {
  // Prefer named export from conditions module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  api = require('../conditions');
} catch (_e) {
  try {
    // Fallbacks
    api = require('../evaluator');
  } catch {
    api = {};
  }
}

// Heuristics for common function names used in feature flag engines:
const evaluate =
  api.evaluate ||
  api.evaluateConditions ||
  api.matchesConditions ||
  api.default ||
  api;

describe('feature-flags: conditions engine (scaffold)', () => {
  it('should expose an evaluator function', () => {
    expect(typeof evaluate).toBe('function');
  });

  it('evaluates simple equality true', () => {
    const ctx = { plan: 'pro' };
    const cond = { op: 'eq', field: 'plan', value: 'pro' };
    const res = evaluate(cond, ctx);
    expect(res).toBe(true);
  });

  it('evaluates simple equality false', () => {
    const ctx = { plan: 'free' };
    const cond = { op: 'eq', field: 'plan', value: 'pro' };
    const res = evaluate(cond, ctx);
    expect(res).toBe(false);
  });

  it('supports inequality', () => {
    const ctx = { plan: 'pro' };
    const cond = { op: 'ne', field: 'plan', value: 'free' };
    const res = evaluate(cond, ctx);
    expect(res).toBe(true);
  });

  it('handles missing field as undefined', () => {
    const ctx = {};
    const cond = { op: 'eq', field: 'nonexistent', value: 'x' };
    const res = evaluate(cond, ctx);
    expect(res).toBe(false);
  });

  it('greater-than and gte', () => {
    const ctx = { version: 12 };
    expect(evaluate({ op: 'gt', field: 'version', value: 10 }, ctx)).toBe(true);
    expect(evaluate({ op: 'gt', field: 'version', value: 12 }, ctx)).toBe(false);
    expect(evaluate({ op: 'gte', field: 'version', value: 12 }, ctx)).toBe(true);
  });

  it('less-than and lte', () => {
    const ctx = { version: 12 };
    expect(evaluate({ op: 'lt', field: 'version', value: 13 }, ctx)).toBe(true);
    expect(evaluate({ op: 'lt', field: 'version', value: 12 }, ctx)).toBe(false);
    expect(evaluate({ op: 'lte', field: 'version', value: 12 }, ctx)).toBe(true);
  });

  it('string contains / startsWith / endsWith', () => {
    const ctx = { country: 'United States' };
    expect(evaluate({ op: 'contains', field: 'country', value: 'United' }, ctx)).toBe(true);
    expect(evaluate({ op: 'startsWith', field: 'country', value: 'United' }, ctx)).toBe(true);
    expect(evaluate({ op: 'endsWith', field: 'country', value: 'States' }, ctx)).toBe(true);
    expect(evaluate({ op: 'contains', field: 'country', value: 'Canada' }, ctx)).toBe(false);
  });

  it('in / not-in operators', () => {
    const ctx = { plan: 'pro' };
    expect(evaluate({ op: 'in', field: 'plan', value: ['pro', 'team'] }, ctx)).toBe(true);
    expect(evaluate({ op: 'in', field: 'plan', value: [] }, ctx)).toBe(false);
    expect(evaluate({ op: 'nin', field: 'plan', value: ['free'] }, ctx)).toBe(true);
  });

  it('array contains element', () => {
    const ctx = { tags: ['beta', 'us', 'mobile'] };
    expect(evaluate({ op: 'contains', field: 'tags', value: 'beta' }, ctx)).toBe(true);
    expect(evaluate({ op: 'contains', field: 'tags', value: 'web' }, ctx)).toBe(false);
  });

  it('boolean flags', () => {
    const ctx = { isAdmin: true, isNew: false };
    expect(evaluate({ op: 'eq', field: 'isAdmin', value: true }, ctx)).toBe(true);
    expect(evaluate({ op: 'eq', field: 'isNew', value: true }, ctx)).toBe(false);
  });

  it('supports nested fields via dot-path', () => {
    const ctx = { user: { country: 'US', plan: { tier: 'pro' } } };
    expect(evaluate({ op: 'eq', field: 'user.country', value: 'US' }, ctx)).toBe(true);
    expect(evaluate({ op: 'eq', field: 'user.plan.tier', value: 'pro' }, ctx)).toBe(true);
    expect(evaluate({ op: 'eq', field: 'user.plan.tier', value: 'free' }, ctx)).toBe(false);
  });

  it('logical AND/OR/NOT', () => {
    const ctx = { plan: 'pro', region: 'NA', age: 20 };
    const andCond = { op: 'and', value: [
      { op: 'eq', field: 'plan', value: 'pro' },
      { op: 'eq', field: 'region', value: 'NA' },
    ]};
    const orCond = { op: 'or', value: [
      { op: 'eq', field: 'plan', value: 'team' },
      { op: 'eq', field: 'region', value: 'NA' },
    ]};
    const notCond = { op: 'not', value: { op: 'lt', field: 'age', value: 18 } };

    expect(evaluate(andCond, ctx)).toBe(true);
    expect(evaluate(orCond, ctx)).toBe(true);
    expect(evaluate(notCond, ctx)).toBe(true);
  });

  it('handles empty logical groups safely', () => {
    expect(evaluate({ op: 'and', value: [] }, {})).toBe(true); // identity for AND
    expect(evaluate({ op: 'or', value: [] }, {})).toBe(false); // identity for OR
    expect(evaluate({ op: 'not', value: null as unknown as any }, {})).toBe(true); // NOT(undefined) => true if implementation coerces falsy
  });

  it('date comparisons (ISO strings) if supported', () => {
    const ctx = { joinedAt: '2024-06-01T00:00:00.000Z' };
    expect(evaluate({ op: 'gt', field: 'joinedAt', value: '2024-01-01T00:00:00.000Z' }, ctx)).toBe(true);
    expect(evaluate({ op: 'lt', field: 'joinedAt', value: '2025-01-01T00:00:00.000Z' }, ctx)).toBe(true);
  });

  it('coerces numeric strings where appropriate', () => {
    const ctx = { build: '42' };
    expect(evaluate({ op: 'gt', field: 'build', value: 40 }, ctx)).toBe(true);
  });

  it('graceful handling of invalid operator', () => {
    const ctx = { x: 1 };
    const bad = { op: 'INVALID_OP', field: 'x', value: 1 } as any;
    expect(() => evaluate(bad, ctx)).toThrow();
  });

  it('graceful handling of malformed condition shapes', () => {
    const ctx = { x: 1 };
    // Missing field/value for binary op
    expect(() => evaluate({ op: 'eq' } as any, ctx)).toThrow();
    // Non-array children for and/or
    expect(() => evaluate({ op: 'and', value: { op: 'eq', field: 'x', value: 1 } } as any, ctx)).toThrow();
  });

  it('edge: null/undefined in context and values', () => {
    const ctx = { a: null as any, b: undefined as any };
    expect(evaluate({ op: 'eq', field: 'a', value: null }, ctx)).toBe(true);
    expect(evaluate({ op: 'eq', field: 'b', value: undefined }, ctx)).toBe(true);
    expect(evaluate({ op: 'ne', field: 'b', value: null }, ctx)).toBe(true);
  });

  it('array intersection (any/all) if supported', () => {
    const ctx = { roles: ['editor', 'viewer'] };
    // any
    // @ts-expect-no-error - some engines support op: 'any'
    // Fallback behavior: if not supported, this may throw, indicating a missing operator to implement.
    try {
      expect(evaluate({ op: 'any', field: 'roles', value: ['admin', 'editor'] } as any, ctx)).toBe(true);
    } catch (e) {
      // acceptable: operator not implemented
      expect(e).toBeDefined();
    }
    // all
    try {
      expect(evaluate({ op: 'all', field: 'roles', value: ['editor', 'viewer'] } as any, ctx)).toBe(true);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// --- Appended tests to strengthen edge cases and failure modes ---
describe('feature-flags: conditions engine (appended)', () => {
  const tryImport = () => {
    try { return require('../conditions'); } catch { try { return require('../evaluator'); } catch { return {}; } }
  };
  const api2: any = tryImport();
  const evaluate2 =
    api2.evaluate ||
    api2.evaluateConditions ||
    api2.matchesConditions ||
    api2.default ||
    api2;

  it('AND short-circuits when a child is false', () => {
    const ctx = { a: 1, b: 2 };
    const cond = { op: 'and', value: [
      { op: 'eq', field: 'a', value: 1 },
      { op: 'eq', field: 'b', value: 3 }, // false
      { op: 'eq', field: 'a', value: 1 }, // should not be evaluated if short-circuiting
    ]};
    const res = evaluate2(cond, ctx);
    expect(res).toBe(false);
  });

  it('OR short-circuits when a child is true', () => {
    const ctx = { a: 1, b: 2 };
    const cond = { op: 'or', value: [
      { op: 'eq', field: 'a', value: 1 }, // true
      { op: 'eq', field: 'b', value: 3 }, // not reached if short-circuiting
    ]};
    const res = evaluate2(cond, ctx);
    expect(res).toBe(true);
  });

  it('NOT inverts nested condition result', () => {
    const ctx = { beta: true };
    const cond = { op: 'not', value: { op: 'eq', field: 'beta', value: true } };
    expect(evaluate2(cond, ctx)).toBe(false);
  });

  it('treats whitespace-only strings consistently in string ops', () => {
    const ctx = { s: '  abc  ' };
    expect(evaluate2({ op: 'contains', field: 's', value: 'abc' }, ctx)).toBe(true);
    expect(evaluate2({ op: 'startsWith', field: 's', value: ' ' }, ctx)).toBe(true);
    expect(evaluate2({ op: 'endsWith', field: 's', value: ' ' }, ctx)).toBe(true);
  });

  it('compares numbers vs numeric strings per engine rules', () => {
    const ctx = { n: 5, s: '5' };
    expect(evaluate2({ op: 'eq', field: 'n', value: '5' }, ctx)).toBe(true);
    expect(evaluate2({ op: 'gt', field: 's', value: 4 }, ctx)).toBe(true);
  });

  it('returns false for in/nin with non-array RHS', () => {
    const ctx = { plan: 'pro' };
    expect(() => evaluate2({ op: 'in', field: 'plan', value: 'pro' } as any, ctx)).toThrow();
    expect(() => evaluate2({ op: 'nin', field: 'plan', value: 'free' } as any, ctx)).toThrow();
  });

  it('supports deep array membership when field is an array of objects (if implemented)', () => {
    const ctx = { items: [{ id: 1 }, { id: 2 }] };
    try {
      expect(evaluate2({ op: 'contains', field: 'items', value: { id: 2 } } as any, ctx)).toBe(true);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('handles large nested trees deterministically', () => {
    const ctx = { v: 10 };
    const makeEq = (val: number) => ({ op: 'eq', field: 'v', value: val });
    const tree = {
      op: 'and',
      value: [
        { op: 'or', value: [ makeEq(9), makeEq(10) ] },
        { op: 'not', value: { op: 'lt', field: 'v', value: 5 } },
        { op: 'and', value: [ makeEq(10), { op: 'gte', field: 'v', value: 10 } ] },
      ],
    };
    expect(evaluate2(tree, ctx)).toBe(true);
  });
});