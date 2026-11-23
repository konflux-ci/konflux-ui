import dayjs from 'dayjs';
import {
  CONFORMA_RESULT_STATUS,
  type ComponentConformaResult,
  type ConformaResultRow,
  type ConformaRule,
} from '~/types/conforma';
import {
  collectPolicyExceptions,
  countExceptionsByKind,
  countPolicyChanges,
  formatDaysRemaining,
  POLICY_EXCEPTION_RULE_CODES,
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

describe('countPolicyChanges', () => {
  const makeRow = (code: string | undefined, status = CONFORMA_RESULT_STATUS.warnings) =>
    ({
      title: code ?? 'no code',
      description: '',
      status,
      component: 'comp',
      images: [],
      code,
    }) as ConformaResultRow;

  it('counts rows announcing an upcoming or expired policy change', () => {
    const rows = [
      makeRow('volatile_config.pending_rule'),
      makeRow('volatile_config.expiring_rule'),
      makeRow('volatile_config.expired_rule'),
    ];

    expect(countPolicyChanges(rows)).toBe(3);
  });

  it('ignores warnings that are not policy changes', () => {
    const rows = [
      makeRow('tasks.deprecated_api'),
      makeRow(undefined),
      makeRow('volatile_config.invalid_config'),
      makeRow('volatile_config.no_expiration'),
      makeRow('volatile_config.pending_rule'),
    ];

    expect(countPolicyChanges(rows)).toBe(1);
  });

  it('counts every row for a rule, since each is a component the change affects', () => {
    const rows = [
      makeRow('volatile_config.expiring_rule'),
      makeRow('volatile_config.expiring_rule'),
    ];

    expect(countPolicyChanges(rows)).toBe(2);
  });

  it('returns zero for an empty result set', () => {
    expect(countPolicyChanges([])).toBe(0);
  });
});

describe('POLICY_EXCEPTION_RULE_CODES', () => {
  it('covers the policy changes plus the config hygiene rules', () => {
    expect([...POLICY_EXCEPTION_RULE_CODES].sort()).toEqual([
      'volatile_config.expired_rule',
      'volatile_config.expiring_rule',
      'volatile_config.invalid_config',
      'volatile_config.no_expiration',
      'volatile_config.pending_rule',
    ]);
  });
});

describe('formatDaysRemaining', () => {
  it('renders the compact day form', () => {
    expect(formatDaysRemaining(15)).toBe('15D');
    expect(formatDaysRemaining(0)).toBe('0D');
  });
});
