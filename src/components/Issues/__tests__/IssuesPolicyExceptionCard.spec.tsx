import { screen } from '@testing-library/react';
import {
  PolicyExceptionKind,
  type PolicyException,
} from '~/components/Conforma/policy-exception-utils';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import IssuesPolicyExceptionCard from '../IssuesPolicyExceptionCard';
import { useWorkspaceConformaViolations } from '../useWorkspaceConformaViolations';

jest.mock('../useWorkspaceConformaViolations', () => ({
  useWorkspaceConformaViolations: jest.fn(),
}));

const mockUseWorkspaceConformaViolations = useWorkspaceConformaViolations as jest.Mock;

const expiring: PolicyException = {
  code: 'attestation_type.known_attestation_type',
  message: 'Attestation type is unknown',
  kind: PolicyExceptionKind.EXPIRING,
  date: '2026-10-12T00:00:00Z',
  daysRemaining: 5,
};

const upcoming: PolicyException = {
  code: 'slsa_provenance.attestation_signed',
  message: 'Provenance attestation is not signed',
  kind: PolicyExceptionKind.UPCOMING,
  date: '2026-10-22T00:00:00Z',
  daysRemaining: 15,
};

const mockHookState = (overrides: Partial<ReturnType<typeof useWorkspaceConformaViolations>>) =>
  mockUseWorkspaceConformaViolations.mockReturnValue({
    totalViolations: 0,
    totalWarnings: 0,
    applications: [],
    exceptions: [],
    loaded: true,
    settling: false,
    error: undefined,
    partialError: undefined,
    ...overrides,
  });

describe('IssuesPolicyExceptionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState({});
  });

  it('shows a loading skeleton before results are loaded', () => {
    mockHookState({ loaded: false });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.queryByTestId('policy-exception-summary')).not.toBeInTheDocument();
  });

  it('keeps the skeleton while results are still settling with no exceptions yet', () => {
    mockHookState({ settling: true });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.queryByTestId('policy-exception-summary')).not.toBeInTheDocument();
  });

  it('renders partial results while settling once exceptions have arrived', () => {
    mockHookState({ settling: true, exceptions: [upcoming] });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.getByTestId('policy-exception-summary')).toBeInTheDocument();
    expect(screen.getByText(upcoming.message)).toBeInTheDocument();
  });

  it('shows an error state when the policy results fail to load', () => {
    mockHookState({ error: { code: 500, message: 'Server error' } });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.queryByTestId('policy-exception-summary')).not.toBeInTheDocument();
  });

  it('renders both summary entries with their counts', () => {
    mockHookState({ exceptions: [expiring, upcoming] });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    const summary = screen.getByTestId('policy-exception-summary');
    expect(summary).toHaveTextContent('1 expiring exceptions');
    expect(summary).toHaveTextContent('1 upcoming activations');
  });

  it('renders a row per exception with its message, code and timing badge', () => {
    mockHookState({ exceptions: [expiring, upcoming] });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    const row = screen.getByTestId(`policy-exception-row-${expiring.code}`);
    expect(row).toHaveTextContent(expiring.message);
    expect(row).toHaveTextContent(expiring.code);
    expect(screen.getByTestId(`policy-exception-timing-${expiring.code}`)).toHaveTextContent('5D');
    expect(screen.getByTestId(`policy-exception-timing-${upcoming.code}`)).toHaveTextContent('15D');
  });

  it('shows zero counts and an empty message when nothing is upcoming', () => {
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    const summary = screen.getByTestId('policy-exception-summary');
    expect(summary).toHaveTextContent('0 expiring exceptions');
    expect(summary).toHaveTextContent('0 upcoming activations');
    expect(screen.getByTestId('policy-exception-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('policy-exception-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('policy-exception-partial-error')).not.toBeInTheDocument();
  });

  it('warns that results are incomplete when a log query failed and no exceptions arrived', () => {
    mockHookState({ partialError: new Error('log fetch failed') });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    const alert = screen.getByTestId('policy-exception-partial-error');
    expect(alert).toHaveTextContent('Some policy results could not be loaded');
    expect(alert).toHaveTextContent('log fetch failed');
    // The zero-count empty state must not be presented as a complete result.
    expect(screen.getByTestId('policy-exception-empty')).toBeInTheDocument();
  });

  it('falls back to a generic message when the partial error has no message', () => {
    mockHookState({ partialError: new Error() });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.getByTestId('policy-exception-partial-error')).toHaveTextContent(
      'One or more policy result fetches failed',
    );
  });

  it('still warns about incomplete results alongside the exceptions that did load', () => {
    mockHookState({ exceptions: [expiring], partialError: new Error('log fetch failed') });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.getByTestId('policy-exception-summary')).toBeInTheDocument();
    expect(screen.getByText(expiring.message)).toBeInTheDocument();
    expect(screen.getByTestId('policy-exception-partial-error')).toBeInTheDocument();
  });

  it('does not show the partial-error warning when the whole query errored', () => {
    mockHookState({
      error: { code: 500, message: 'Server error' },
      partialError: new Error('log fetch failed'),
    });
    renderWithQueryClient(<IssuesPolicyExceptionCard />);

    expect(screen.queryByTestId('policy-exception-partial-error')).not.toBeInTheDocument();
  });
});
