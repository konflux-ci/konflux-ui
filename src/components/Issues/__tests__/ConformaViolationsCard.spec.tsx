import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { ConformaViolationsCard } from '../ConformaViolationsCard';
import { useWorkspaceConformaViolations } from '../useWorkspaceConformaViolations';

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-ns',
}));

jest.mock('../useWorkspaceConformaViolations');

const mockHook = jest.mocked(useWorkspaceConformaViolations);

const renderCard = () =>
  renderWithQueryClient(
    <MemoryRouter>
      <ConformaViolationsCard />
    </MemoryRouter>,
  );

describe('ConformaViolationsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading skeleton while data is not loaded', () => {
    mockHook.mockReturnValue({
      totalViolations: 0,
      totalWarnings: 0,
      applications: [],
      loaded: false,
    });

    renderCard();
    expect(screen.getAllByText('Loading content').length).toBeGreaterThan(0);
    expect(screen.queryByText(/policy violation/)).not.toBeInTheDocument();
  });

  it('shows an all-passed message when there are no violations or warnings', () => {
    mockHook.mockReturnValue({
      totalViolations: 0,
      totalWarnings: 0,
      applications: [{ applicationName: 'clean-app', violationCount: 0, warningCount: 0 }],
      loaded: true,
    });

    renderCard();
    expect(screen.getByText('All applications passed')).toBeInTheDocument();
    expect(screen.queryByText(/policy violation/)).not.toBeInTheDocument();
  });

  it('shows an error state when a fatal error occurs', () => {
    mockHook.mockReturnValue({
      totalViolations: 0,
      totalWarnings: 0,
      applications: [],
      loaded: true,
      error: new Error('fetch failed'),
    });

    renderCard();
    expect(screen.queryByText('All applications passed')).not.toBeInTheDocument();
    expect(screen.queryByText(/policy violation/)).not.toBeInTheDocument();
  });

  it('shows a partial error alert when some results could not be loaded', () => {
    mockHook.mockReturnValue({
      totalViolations: 1,
      totalWarnings: 0,
      applications: [{ applicationName: 'my-app', violationCount: 1, warningCount: 0 }],
      loaded: true,
      partialError: new Error('log fetch failed'),
    });

    renderCard();
    expect(screen.getByText('Some policy results could not be loaded')).toBeInTheDocument();
    expect(screen.getByText(/policy violation/)).toBeInTheDocument();
  });

  it('shows a no-data message when there are no evaluated applications', () => {
    mockHook.mockReturnValue({
      totalViolations: 0,
      totalWarnings: 0,
      applications: [],
      loaded: true,
    });

    renderCard();
    expect(screen.getByText(/No policy evaluations found/)).toBeInTheDocument();
    expect(screen.queryByText('All applications passed')).not.toBeInTheDocument();
  });

  it('displays total policy violations count', () => {
    mockHook.mockReturnValue({
      totalViolations: 3,
      totalWarnings: 0,
      applications: [{ applicationName: 'my-app', violationCount: 3, warningCount: 0 }],
      loaded: true,
    });

    renderCard();
    expect(screen.getByText('3', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/policy violations/)).toBeInTheDocument();
  });

  it('uses singular form for exactly 1 violation', () => {
    mockHook.mockReturnValue({
      totalViolations: 1,
      totalWarnings: 0,
      applications: [{ applicationName: 'my-app', violationCount: 1, warningCount: 0 }],
      loaded: true,
    });

    renderCard();
    expect(screen.getByText(/policy violation$/)).toBeInTheDocument();
  });

  it('displays total warnings count when there are no violations', () => {
    mockHook.mockReturnValue({
      totalViolations: 0,
      totalWarnings: 2,
      applications: [{ applicationName: 'app-b', violationCount: 0, warningCount: 2 }],
      loaded: true,
    });

    renderCard();
    expect(screen.getByText('2', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getAllByText(/warnings/).length).toBeGreaterThan(0);
  });

  it('renders per-application breakdown links', () => {
    mockHook.mockReturnValue({
      totalViolations: 5,
      totalWarnings: 0,
      applications: [
        { applicationName: 'app-one', violationCount: 3, warningCount: 0 },
        { applicationName: 'app-two', violationCount: 2, warningCount: 0 },
      ],
      loaded: true,
    });

    renderCard();
    expect(screen.getByRole('link', { name: 'app-one' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'app-two' })).toBeInTheDocument();
  });

  it('each app link points to the conforma-results tab', () => {
    mockHook.mockReturnValue({
      totalViolations: 1,
      totalWarnings: 0,
      applications: [{ applicationName: 'my-app', violationCount: 1, warningCount: 0 }],
      loaded: true,
    });

    renderCard();
    const link = screen.getByRole('link', { name: 'my-app' });
    expect(link).toHaveAttribute('href', expect.stringContaining('/conforma-results'));
  });
});
