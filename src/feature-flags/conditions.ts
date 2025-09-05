const CONDITIONS = {
  KUBEARCHIVE: 'isKubearchiveEnabled',
  STAGING: 'isStagingCluster',
} as const;

export type ConditionState = Partial<Record<ConditionKey, boolean>>;

export type ConditionKey = (typeof CONDITIONS)[keyof typeof CONDITIONS];

export interface GuardSpec {
  /** All of these conditions must be true (AND) */
  allOf?: ConditionKey[];
  /** At least one of these must be true (OR) */
  anyOf?: ConditionKey[];
  /** message for Dev Panel / tooltips
   *  when guard fails, show the flag entry disabled with the reason
   */
  failureReason: string;
  /** visibility flag for Dev Panel / tooltips. default: false
   *  visible: true => show the flag disabled with its reason
   *  visible: false => hide the flag entirely when guard conditions aren't met
   */
  visibleInFeatureFlagPanel: boolean;
}

export type ConditionResolver = <T>(ctx?: T) => Promise<boolean>;

export type Entry = {
  resolver: ConditionResolver;
  ttlMs: number;
  cached?: { at: number; val: boolean };
  inflight?: Promise<boolean>;
};

const REGISTRY = new Map<ConditionKey, Entry>();

export const registerCondition = (
  key: ConditionKey,
  resolver: ConditionResolver,
  ttlMs = Infinity,
) => {
  if (!REGISTRY.has(key)) REGISTRY.set(key, { resolver, ttlMs });
};

export const invalidateConditions = (keys?: ConditionKey[]) => {
  const ks = keys ?? Array.from(REGISTRY.keys());
  ks.forEach((k) => {
    const e = REGISTRY.get(k);
    if (e) {
      e.cached = undefined;
      e.inflight = undefined;
    }
  });
};

export const guardSatisfied = (guard: GuardSpec | undefined, conds: ConditionState): boolean => {
  if (!guard) return true;
  const { allOf, anyOf } = guard;
  const allOk = allOf ? allOf.every((k) => !!conds[k]) : true;
  const anyOk = anyOf ? anyOf.some((k) => !!conds[k]) : true;
  return allOk && anyOk;
};

export const evaluateConditions = async <T>(
  keys: ConditionKey[],
  ctx?: T,
): Promise<ConditionState> => {
  const out: ConditionState = {};
  await Promise.all(
    keys.map(async (k) => {
      const e = REGISTRY.get(k);
      if (!e) {
        out[k] = false;
        return;
      }

      const now = Date.now();
      if (e.cached && now - e.cached.at < e.ttlMs) {
        out[k] = e.cached.val;
        return;
      }
      if (e.inflight) {
        out[k] = await e.inflight;
        return;
      }

      e.inflight = (async () => {
        try {
          const val = !!(await e.resolver(ctx));
          e.cached = { at: Date.now(), val };
          return val;
        } catch {
          e.cached = { at: Date.now(), val: false };
          return false;
        } finally {
          e.inflight = undefined;
        }
      })();

      out[k] = await e.inflight;
    }),
  );

  return out;
};
