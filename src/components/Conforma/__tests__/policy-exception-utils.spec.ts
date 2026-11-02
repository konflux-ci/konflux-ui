import dayjs from 'dayjs';
import { type ComponentConformaResult, type ConformaRule } from '~/types/conforma';
import {
  collectPolicyExceptions,
  countExceptionsByKind,
  formatDaysRemaining,
  PolicyExceptionKind,
} from '../policy-exception-utils';

const NOW = dayjs('2026-10-07T00:00:00Z');

type RuleDates = { effectiveOn?: string; effectiveUntil?: string };

const makeRule = (
  code: string,
  { effectiveOn, effectiveUntil }: RuleDates = {},
  msg = `${code} message`,
): ConformaRule => ({
  metadata: {
    title: `${code} title`,
    description: '',
    collections: [],
    code,
    ['effective_on']: effectiveOn,
    ['effective_until']: effectiveUntil,
  },
  msg,
});

const makeResult = (warnings: ConformaRule[], name = 'comp'): ComponentConformaResult => ({
  containerImage: 'quay.io/test/img',
  name,
  success: false,
  warnings,
});

describe('collectPolicyExceptions', () => {
  it('returns no exceptions when there are no warnings', () => {
    expect(collectPolicyExceptions([makeResult([])], NOW)).toEqual([]);
    expect(collectPolicyExceptions([], NOW)).toEqual([]);
  });

  it('classifies a future effective_on as an upcoming activation', () => {
    const results = [makeResult([makeRule('rule.a', { effectiveOn: '2026-10-22T00:00:00Z' })])];

    const [exception] = collectPolicyExceptions(results, NOW);

    expect(exception).toMatchObject({
      code: 'rule.a',
      message: 'rule.a message',
      kind: PolicyExceptionKind.UPCOMING,
      daysRemaining: 15,
    });
  });

  it('classifies a future effective_until as an expiring exception', () => {
    const results = [makeResult([makeRule('rule.b', { effectiveUntil: '2026-10-12T00:00:00Z' })])];

    const [exception] = collectPolicyExceptions(results, NOW);

    expect(exception).toMatchObject({
      code: 'rule.b',
      kind: PolicyExceptionKind.EXPIRING,
      daysRemaining: 5,
    });
  });

  it('prefers the exception expiry when a rule has both dates', () => {
    const results = [
      makeResult([
        makeRule('rule.c', {
          effectiveOn: '2026-10-30T00:00:00Z',
          effectiveUntil: '2026-10-12T00:00:00Z',
        }),
      ]),
    ];

    const exceptions = collectPolicyExceptions(results, NOW);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0].kind).toBe(PolicyExceptionKind.EXPIRING);
    expect(exceptions[0].daysRemaining).toBe(5);
  });

  it('ignores rules whose dates are in the past or missing', () => {
    const results = [
      makeResult([
        makeRule('rule.past', { effectiveOn: '2020-01-01T00:00:00Z' }),
        makeRule('rule.expired', { effectiveUntil: '2020-01-01T00:00:00Z' }),
        makeRule('rule.none'),
      ]),
    ];

    expect(collectPolicyExceptions(results, NOW)).toEqual([]);
  });

  it('ignores rules without a code and rules with an unparseable date', () => {
    const results = [
      makeResult([
        makeRule('', { effectiveOn: '2026-10-22T00:00:00Z' }),
        makeRule('rule.bad-date', { effectiveOn: 'not-a-date' }),
      ]),
    ];

    expect(collectPolicyExceptions(results, NOW)).toEqual([]);
  });

  it('collapses the same rule reported for several components, keeping the soonest date', () => {
    const results = [
      makeResult([makeRule('rule.a', { effectiveOn: '2026-10-30T00:00:00Z' })], 'comp-a'),
      makeResult([makeRule('rule.a', { effectiveOn: '2026-10-17T00:00:00Z' })], 'comp-b'),
    ];

    const exceptions = collectPolicyExceptions(results, NOW);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0].daysRemaining).toBe(10);
  });

  it('keeps expiring and upcoming entries separate for the same rule code', () => {
    const results = [
      makeResult([makeRule('rule.a', { effectiveOn: '2026-10-30T00:00:00Z' })], 'comp-a'),
      makeResult([makeRule('rule.a', { effectiveUntil: '2026-10-12T00:00:00Z' })], 'comp-b'),
    ];

    const exceptions = collectPolicyExceptions(results, NOW);

    expect(exceptions.map((e) => e.kind)).toEqual([
      PolicyExceptionKind.EXPIRING,
      PolicyExceptionKind.UPCOMING,
    ]);
  });

  it('sorts the most urgent entries first', () => {
    const results = [
      makeResult([
        makeRule('rule.late', { effectiveOn: '2026-12-01T00:00:00Z' }),
        makeRule('rule.soon', { effectiveOn: '2026-10-09T00:00:00Z' }),
        makeRule('rule.mid', { effectiveOn: '2026-10-22T00:00:00Z' }),
      ]),
    ];

    expect(collectPolicyExceptions(results, NOW).map((e) => e.code)).toEqual([
      'rule.soon',
      'rule.mid',
      'rule.late',
    ]);
  });

  it('falls back to the rule title when the warning has no message', () => {
    const results = [makeResult([makeRule('rule.a', { effectiveOn: '2026-10-22T00:00:00Z' }, '')])];

    expect(collectPolicyExceptions(results, NOW)[0].message).toBe('rule.a title');
  });

  it('clamps a same-day date to zero days remaining', () => {
    const results = [makeResult([makeRule('rule.a', { effectiveOn: '2026-10-07T06:00:00Z' })])];

    expect(collectPolicyExceptions(results, NOW)[0].daysRemaining).toBe(0);
  });
});

describe('countExceptionsByKind', () => {
  it('counts only entries of the requested kind', () => {
    const exceptions = collectPolicyExceptions(
      [
        makeResult([
          makeRule('rule.a', { effectiveOn: '2026-10-22T00:00:00Z' }),
          makeRule('rule.b', { effectiveOn: '2026-10-30T00:00:00Z' }),
          makeRule('rule.c', { effectiveUntil: '2026-10-12T00:00:00Z' }),
        ]),
      ],
      NOW,
    );

    expect(countExceptionsByKind(exceptions, PolicyExceptionKind.UPCOMING)).toBe(2);
    expect(countExceptionsByKind(exceptions, PolicyExceptionKind.EXPIRING)).toBe(1);
  });
});

describe('formatDaysRemaining', () => {
  it('renders the compact day form', () => {
    expect(formatDaysRemaining(15)).toBe('15D');
    expect(formatDaysRemaining(0)).toBe('0D');
  });
});
