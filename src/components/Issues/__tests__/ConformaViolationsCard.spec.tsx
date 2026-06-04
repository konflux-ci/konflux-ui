import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { ConformaViolationsCard } from '~/components/Issues/ConformaViolationsCard';
import {
  useWorkspaceConformaViolations,
  WorkspaceConformaViolations,
} from '~/components/Issues/useWorkspaceConformaViolations';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';

jest.mock('../useWorkspaceConformaViolations');
jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-ns',
}));

const mockUseWorkspaceConformaViolations = useWorkspaceConformaViolations as jest.MockedFunction<
  typeof useWorkspaceConformaViolations
>;

describe('ConformaViolationsCard', () => {
  const renderComponent = () => {
    return renderWithQueryClient(
      <MemoryRouter>
        <ConformaViolationsCard />
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading skeleton when data is not loaded', () => {
    mockUseWorkspaceConformaViolations.mockReturnValue({
      applications: [],
      totalViolations: 0,
      totalWarnings: 0,
      loaded: false,
      error: undefined,
    });

    renderComponent();
    expect(screen.getByText('Conforma Policy Violations')).toBeInTheDocument();
    expect(screen.queryByText('No conforma violations')).not.toBeInTheDocument();
  });

  it('should render success message when no violations exist', () => {
    mockUseWorkspaceConformaViolations.mockReturnValue({
      applications: [],
      totalViolations: 0,
      totalWarnings: 0,
      loaded: true,
      error: undefined,
    });

    renderComponent();
    expect(screen.getByText('No conforma violations')).toBeInTheDocument();
  });

  it('should render aggregate count and per-app breakdown', () => {
    const mockData: WorkspaceConformaViolations = {
      applications: [
        { applicationName: 'my-frontend', violationCount: 5, warningCount: 2 },
        { applicationName: 'backend-api', violationCount: 3, warningCount: 0 },
      ],
      totalViolations: 8,
      totalWarnings: 2,
      loaded: true,
      error: undefined,
    };
    mockUseWorkspaceConformaViolations.mockReturnValue(mockData);

    renderComponent();

    expect(
      screen.getByText('8 violations, 2 warnings across 2 applications'),
    ).toBeInTheDocument();
    expect(screen.getByText('my-frontend')).toBeInTheDocument();
    expect(screen.getByText('backend-api')).toBeInTheDocument();
  });

  it('should render correct links to each application policy tab', () => {
    mockUseWorkspaceConformaViolations.mockReturnValue({
      applications: [{ applicationName: 'my-app', violationCount: 3, warningCount: 0 }],
      totalViolations: 3,
      totalWarnings: 0,
      loaded: true,
      error: undefined,
    });

    renderComponent();

    const link = screen.getByTestId('policy-link-my-app');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/my-app/conforma-results',
    );
  });

  it('should handle only warnings (no violations)', () => {
    mockUseWorkspaceConformaViolations.mockReturnValue({
      applications: [{ applicationName: 'warn-app', violationCount: 0, warningCount: 4 }],
      totalViolations: 0,
      totalWarnings: 4,
      loaded: true,
      error: undefined,
    });

    renderComponent();
    expect(screen.getByText('4 warnings across 1 application')).toBeInTheDocument();
  });

  it('should render singular form for single violation', () => {
    mockUseWorkspaceConformaViolations.mockReturnValue({
      applications: [{ applicationName: 'single-app', violationCount: 1, warningCount: 0 }],
      totalViolations: 1,
      totalWarnings: 0,
      loaded: true,
      error: undefined,
    });

    renderComponent();
    expect(screen.getByText('1 violation across 1 application')).toBeInTheDocument();
  });

  it('should render error state when error occurs', () => {
    mockUseWorkspaceConformaViolations.mockReturnValue({
      applications: [],
      totalViolations: 0,
      totalWarnings: 0,
      loaded: true,
      error: { code: 500, message: 'Server error' },
    });

    renderComponent();
    expect(screen.queryByText('No conforma violations')).not.toBeInTheDocument();
  });
});
