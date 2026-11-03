import dayjs from 'dayjs';
import { type ComponentConformaResult } from '~/types/conforma';

export enum PolicyExceptionKind {
  /** A policy exception waiving the rule is about to lapse. */
  EXPIRING = 'expiring',
  /** The rule is not enforced yet and becomes active on a future date. */
  UPCOMING = 'upcoming',
}

export type PolicyException = {
  /** Policy rule code, e.g. `attestation_type.known_attestation_type`. */
  code: string;
  /** Human readable warning message for the rule. */
  message: string;
  kind: PolicyExceptionKind;
  /** ISO timestamp the exception expires (expiring) or the rule activates (upcoming). */
  date: string;
  /** Whole days from now until `date`; never negative. */
  daysRemaining: number;
};

/** Shape shared by the two Conforma result representations we collect from. */
type PolicyExceptionInput = {
  code?: string;
  message?: string;
  /** Date the rule itself starts being enforced. */
  effectiveOn?: string;
  /** Date the exception waiving the rule lapses. */
  effectiveUntil?: string;
};

const parseFutureDate = (value: string | undefined, now: dayjs.Dayjs): dayjs.Dayjs | undefined => {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.isAfter(now) ? parsed : undefined;
};

/**
 * Conforma reports a rule as a warning (rather than a violation) while it is
 * not yet enforced. `effectiveUntil` means an exception currently waives the
 * rule and lapses on that date; `effectiveOn` means the rule itself starts
 * being enforced on that date. Dates in the past are ignored — those rules are
 * already enforced, so there is nothing upcoming to flag.
 */
const toPolicyException = (
  input: PolicyExceptionInput,
  now: dayjs.Dayjs,
): PolicyException | undefined => {
  const { code } = input;
  if (!code) return undefined;

  const expiry = parseFutureDate(input.effectiveUntil, now);
  const activation = expiry ? undefined : parseFutureDate(input.effectiveOn, now);
  const target = expiry ?? activation;
  if (!target) return undefined;

  return {
    code,
    message: input.message || code,
    kind: expiry ? PolicyExceptionKind.EXPIRING : PolicyExceptionKind.UPCOMING,
    date: target.toISOString(),
    daysRemaining: Math.max(0, target.diff(now, 'day')),
  };
};

/**
 * Collapses the same rule reported for several components into one entry,
 * keeping the soonest date, and sorts the most urgent entries first.
 */
const collect = (inputs: PolicyExceptionInput[], now: dayjs.Dayjs): PolicyException[] => {
  const byKey = new Map<string, PolicyException>();

  inputs.forEach((input) => {
    const exception = toPolicyException(input, now);
    if (!exception) return;

    const key = `${exception.kind}:${exception.code}`;
    const existing = byKey.get(key);
    if (!existing || exception.daysRemaining < existing.daysRemaining) {
      byKey.set(key, exception);
    }
  });

  return Array.from(byKey.values()).sort(
    (a, b) => a.daysRemaining - b.daysRemaining || a.code.localeCompare(b.code),
  );
};

/** Collects upcoming policy changes from the raw Conforma report components. */
export const collectPolicyExceptions = (
  componentResults: ComponentConformaResult[],
  now: dayjs.Dayjs = dayjs(),
): PolicyException[] =>
  collect(
    componentResults.flatMap((result) =>
      (result.warnings ?? []).map((rule) => ({
        code: rule.metadata?.code,
        message: rule.msg || rule.metadata?.title,
        effectiveOn: rule.metadata?.effective_on,
        effectiveUntil: rule.metadata?.effective_until,
      })),
    ),
    now,
  );

/**
 * Rules whose warnings describe a policy exception. Conforma namespaces them
 * under `volatile_config` because the exception itself lives in the policy's
 * volatile config. The set is enumerated rather than prefix-matched so that a
 * new `volatile_config.*` rule cannot silently widen what the "Show policy
 * exceptions" filter pulls in.
 */
export const POLICY_EXCEPTION_RULE_CODES = [
  'volatile_config.expiring_rule',
  'volatile_config.expired_rule',
  'volatile_config.invalid_config',
  'volatile_config.no_expiration',
  'volatile_config.pending_rule',
] as const;

export const countExceptionsByKind = (
  exceptions: PolicyException[],
  kind: PolicyExceptionKind,
): number => exceptions.filter((exception) => exception.kind === kind).length;

/** Compact badge form, e.g. `15D`. */
export const formatDaysRemaining = (daysRemaining: number): string => `${daysRemaining}D`;
