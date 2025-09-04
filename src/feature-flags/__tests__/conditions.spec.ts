/**
 * conditions.spec.ts
 *
 * Test framework: Uses Jest or Vitest globals (describe, it/test, expect).
 * No new dependencies introduced; tests are framework-agnostic and rely on globals.
 */
import { registerCondition, evaluateConditions, invalidateConditions, guardSatisfied } from "../conditions";

describe("feature-flags/conditions module", () => {
  type Key = "isKubearchiveEnabled" | "isStagingCluster";
  const KUBE: Key = "isKubearchiveEnabled";
  const STAGING: Key = "isStagingCluster";

  // Shared mutable state to control resolver behaviors per test
  const kubearchiveState: { val: unknown; throws: boolean } = { val: false, throws: false };
  const stagingState: { val: unknown; delayMs: number; calls: number } = { val: false, delayMs: 0, calls: 0 };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeAll(() => {
    // Register only once; subsequent register attempts should be ignored by implementation.
    registerCondition(
      KUBE,
      async () => {
        if (kubearchiveState.throws) throw new Error("boom");
        return kubearchiveState.val;
      },
      Infinity, // cache forever unless invalidated
    );

    registerCondition(
      STAGING,
      async () => {
        stagingState.calls += 1;
        if (stagingState.delayMs > 0) {
          await sleep(stagingState.delayMs);
        }
        return stagingState.val;
      },
      0, // TTL 0 ensures no cache; good for coercion & re-eval scenarios
    );
  });

  beforeEach(() => {
    // Reset mutable state and clear caches/inflight between tests
    kubearchiveState.val = false;
    kubearchiveState.throws = false;
    stagingState.val = false;
    stagingState.delayMs = 0;
    stagingState.calls = 0;
    invalidateConditions(); // clears cached & inflight for all keys
  });

  describe("guardSatisfied()", () => {
    it("returns true when guard is undefined", () => {
      const res = guardSatisfied(undefined, {});
      expect(res).toBe(true);
    });

    it("AND: allOf must all be true", () => {
      const conds = { [KUBE]: true, [STAGING]: false } as const;
      const res1 = guardSatisfied({ allOf: [KUBE], reason: "r", visible: false }, conds);
      const res2 = guardSatisfied({ allOf: [KUBE, STAGING], reason: "r", visible: false }, conds);
      expect(res1).toBe(true);
      expect(res2).toBe(false);
    });

    it("OR: anyOf returns true if at least one is true", () => {
      const conds = { [KUBE]: false, [STAGING]: true } as const;
      const res1 = guardSatisfied({ anyOf: [KUBE, STAGING], reason: "r", visible: false }, conds);
      const res2 = guardSatisfied({ anyOf: [KUBE], reason: "r", visible: false }, conds);
      expect(res1).toBe(true);
      expect(res2).toBe(false);
    });

    it("Combined AND + OR requires both groups to be satisfied", () => {
      const conds = { [KUBE]: true, [STAGING]: false } as const;
      const res1 = guardSatisfied({ allOf: [KUBE], anyOf: [STAGING], reason: "r", visible: false }, conds);
      const res2 = guardSatisfied({ allOf: [KUBE], anyOf: [KUBE, STAGING], reason: "r", visible: false }, conds);
      expect(res1).toBe(false);
      expect(res2).toBe(true);
    });

    it("Edge cases: explicit empty arrays behave as vacuous AND and false OR", () => {
      const conds = {} as Record<string, boolean>;
      // allOf undefined -> true, anyOf [] -> false; overall false
      const res = guardSatisfied({ allOf: undefined, anyOf: [], reason: "edge", visible: false }, conds);
      expect(res).toBe(false);
    });
  });

  describe("evaluateConditions()", () => {
    it("returns false for unknown/unregistered keys", async () => {
      const out = await evaluateConditions(["__unknown_key__" as Key]);
      expect(out["__unknown_key__" as Key]).toBe(false);
    });

    it("coerces resolver outputs to boolean (truthy/falsy)", async () => {
      stagingState.val = "hello"; // truthy
      let out = await evaluateConditions([STAGING]);
      expect(out[STAGING]).toBe(true);

      stagingState.val = 0; // falsy
      out = await evaluateConditions([STAGING]);
      expect(out[STAGING]).toBe(false);

      stagingState.val = []; // truthy
      out = await evaluateConditions([STAGING]);
      expect(out[STAGING]).toBe(true);
    });

    it("caches successful resolution for Infinity TTL until invalidated", async () => {
      kubearchiveState.val = true;
      const out1 = await evaluateConditions([KUBE]);
      expect(out1[KUBE]).toBe(true);

      // Change underlying value; should still serve cached value
      kubearchiveState.val = false;
      const out2 = await evaluateConditions([KUBE]);
      expect(out2[KUBE]).toBe(true);

      // After invalidation, should reflect new value
      invalidateConditions([KUBE]);
      const out3 = await evaluateConditions([KUBE]);
      expect(out3[KUBE]).toBe(false);
    });

    it("deduplicates concurrent evaluations using inflight promise (single resolver call)", async () => {
      stagingState.delayMs = 30;
      stagingState.val = true;

      const p1 = evaluateConditions([STAGING]);

      const p2 = evaluateConditions([STAGING]);

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(stagingState.calls).toBe(1);
      expect(r1[STAGING]).toBe(true);
      expect(r2[STAGING]).toBe(true);
    });

    it("caches failures as false for Infinity TTL and serves until invalidated", async () => {
      kubearchiveState.throws = true;
      const out1 = await evaluateConditions([KUBE]);
      expect(out1[KUBE]).toBe(false);

      // Even after switching to success, still returns cached false until invalidated
      kubearchiveState.throws = false;
      const out2 = await evaluateConditions([KUBE]);
      expect(out2[KUBE]).toBe(false);

      invalidateConditions([KUBE]);
      const out3 = await evaluateConditions([KUBE]);
      expect(out3[KUBE]).toBe(true);
    });

    it("evaluates multiple keys and returns a complete ConditionState map", async () => {
      kubearchiveState.val = true;
      stagingState.val = false;

      const out = await evaluateConditions([KUBE, STAGING]);
      expect(out).toHaveProperty(KUBE, true);
      expect(out).toHaveProperty(STAGING, false);
    });

    it("registerCondition is idempotent: second registration is ignored", async () => {
      // Attempt to re-register with a resolver that would flip value if used.
      let secondCalls = 0;
      registerCondition(
        KUBE,
        async () => {
          secondCalls += 1;
          return false;
        },
        0,
      );

      kubearchiveState.val = true;
      invalidateConditions([KUBE]);
      const out = await evaluateConditions([KUBE]);

      expect(out[KUBE]).toBe(true);
      expect(secondCalls).toBe(0);
    });
  });
});