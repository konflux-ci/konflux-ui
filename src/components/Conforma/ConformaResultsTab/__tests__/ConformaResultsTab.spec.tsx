import { screen } from '@testing-library/react';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import { ConformaResultsTab } from '../ConformaResultsTab';
import type { ApplicationConformaResults, ConformaResultRow } from '../useApplicationConformaResults';
import { useApplicationConformaResults } from '../useApplicationConformaResults';
import '@testing-library/jest-dom';

jest.mock('../useApplicationConformaResults', () => ({
  useApplicationConformaResults: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    applicationName: 'test-app',
  }),
}));

const mockUseApplicationConformaResults = useApplicationConformaResults as jest.Mock;

const createMockRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'A test rule description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  msg: 'Test message',
  ...overrides,
});

const emptyResults: ApplicationConformaResults = {
  componentStatuses: [],
  allResults: [],
  totalComponents: 0,
  totalFailed: 0,
  totalViolations: 0,
  totalWarnings: 0,
  totalSuccesses: 0,
  loaded: true,
  error: undefined,
};

const populatedResults: ApplicationConformaResults = {
  componentStatuses: [
    {
      componentName: 'api-gateway',
      status: 'fail',
      violationCount: 2,
      warningCount: 1,
      successCount: 3,
    },
    {
      componentName: 'auth-service',
      status: 'pass',
      violationCount: 0,
      warningCount: 0,
      successCount: 5,
    },
  ],
  allResults: [
    createMockRow({
      title: 'Missing CVE scan',
      component: 'api-gateway',
      status: CONFORMA_RESULT_STATUS.violations,
    }),
    createMockRow({
      title: 'Missing CVE scan',
      component: 'api-gateway',
      status: CONFORMA_RESULT_STATUS.violations,
    }),
    createMockRow({
      title: 'Deprecated API',
      component: 'api-gateway',
      status: CONFORMA_RESULT_STATUS.warnings,
    }),
    createMockRow({
      title: 'Base image allowed',
      component: 'auth-service',
      status: CONFORMA_RESULT_STATUS.successes,
    }),
  ],
  totalComponents: 2,
  totalFailed: 1,
  totalViolations: 2,
  totalWarnings: 1,
  totalSuccesses: 1,
  loaded: true,
  error: undefined,
};

describe('ConformaResultsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a spinner when data is loading', () => {
    mockUseApplicationConformaResults.mockReturnValue({
      ...emptyResults,
      loaded: false,
    });

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error message when there is an error', () => {
    mockUseApplicationConformaResults.mockReturnValue({
      ...emptyResults,
      loaded: true,
      error: new Error('fetch failed'),
    });

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByText('Unable to load Conforma results.')).toBeInTheDocument();
  });

  it('shows empty state when allResults is empty', () => {
    mockUseApplicationConformaResults.mockReturnValue(emptyResults);

    routerRenderer(<ConformaResultsTab />);

    expect(
      screen.getByText('No Conforma results available for this application.'),
    ).toBeInTheDocument();
  });

  it('renders summary bar and grouped table when results are populated', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByTestId('conforma-summary-bar')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-results-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-grouped-table')).toBeInTheDocument();
  });

  it('renders the page title and description', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getByText('Conforma results summary')).toBeInTheDocument();
    expect(
      screen.getByText(/Conforma is a set of tools for verifying the provenance/),
    ).toBeInTheDocument();
  });

  it('shows group rows matching the grouped data', () => {
    mockUseApplicationConformaResults.mockReturnValue(populatedResults);

    routerRenderer(<ConformaResultsTab />);

    expect(screen.getAllByText('Missing CVE scan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Deprecated API').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Base image allowed').length).toBeGreaterThanOrEqual(1);
  });
});
