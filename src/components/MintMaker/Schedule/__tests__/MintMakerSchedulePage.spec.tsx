import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useMintMakerSchedule } from '~/hooks/useMintMakerSchedule';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import { MintMakerSchedulePage } from '../MintMakerSchedulePage';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('~/hooks/useMintMakerSchedule', () => ({
  useMintMakerSchedule: jest.fn(),
}));

const useMintMakerScheduleMock = useMintMakerSchedule as jest.Mock;

const mockSchedule = [
  {
    manager: 'renovate',
    scheduledRuns: ['2026-08-15T10:00:00Z', '2026-08-22T10:00:00Z', '2026-08-29T10:00:00Z'],
  },
  {
    manager: 'dependabot',
    scheduledRuns: ['2026-08-16T10:00:00Z'],
  },
];

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <MintMakerSchedulePage />
  </NuqsTestingAdapter>
);

describe('MintMakerSchedulePage', () => {
  beforeEach(() => {
    setupVirtualizerMock();
    useMintMakerScheduleMock.mockReturnValue([mockSchedule, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders the page title', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Dependency updates schedule')).toBeInTheDocument();
  });

  it('renders skeleton while schedule is loading', () => {
    useMintMakerScheduleMock.mockReturnValue([[], false, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.queryByTestId('mintmaker-schedule-table')).not.toBeInTheDocument();
  });

  it('renders a table row per manager when data is available', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByText('Renovate')).toBeInTheDocument();
      expect(screen.getByText('Dependabot')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('table-row')).toHaveLength(2);
  });

  it('renders the next scheduled run in each table row', () => {
    renderWithQueryClient(<TestedComponent />);
    const rows = screen.getAllByTestId('table-row');
    expect(within(rows[0]).getByTestId('mintmaker-schedule-next-run')).toBeInTheDocument();
    expect(within(rows[0]).getByTestId('mintmaker-schedule-next-countdown')).toBeInTheDocument();
  });

  it('renders a fallback when a manager has no scheduled runs', () => {
    useMintMakerScheduleMock.mockReturnValue([
      [{ manager: 'renovate', scheduledRuns: [] }],
      true,
      undefined,
    ]);

    renderWithQueryClient(<TestedComponent />);

    const row = screen.getByTestId('table-row');
    expect(within(row).getByTestId('mintmaker-schedule-next-run')).toHaveTextContent('-');
    expect(within(row).queryByTestId('mintmaker-schedule-next-countdown')).not.toBeInTheDocument();
  });

  it('renders future runs in expanded content', async () => {
    renderWithQueryClient(<TestedComponent />);

    const renovateRow = screen.getAllByTestId('table-row')[0];
    expect(screen.queryByTestId('mintmaker-schedule-expanded-content')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(within(renovateRow).getByRole('button'));

    const expandedContent = screen.getByTestId('mintmaker-schedule-expanded-content');
    expect(within(expandedContent).getByText('Future runs')).toBeInTheDocument();
    expect(within(expandedContent).getAllByTestId('mintmaker-schedule-future-run')).toHaveLength(2);
  });

  it('renders the filter toolbar when schedule is non-empty', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();
  });

  it('does not render the filter toolbar when schedule is empty', () => {
    useMintMakerScheduleMock.mockReturnValue([[], true, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.queryByTestId('filter-toolbar')).not.toBeInTheDocument();
  });

  it('treats an undefined schedule as an empty schedule', () => {
    useMintMakerScheduleMock.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('No upcoming runs scheduled')).toBeInTheDocument();
  });

  it('renders the search filter input for manager', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('search-filter-manager')).toBeInTheDocument();
  });

  it('renders the manager-specific empty state when no schedule exists', () => {
    useMintMakerScheduleMock.mockReturnValue([[], true, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('No upcoming runs scheduled')).toBeInTheDocument();
  });

  it('renders filtered empty state when active filter yields no results', () => {
    renderWithQueryClient(<TestedComponent searchParams="?manager=no-match-xyz" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders the not-found empty state when schedule configmap returns 404', () => {
    useMintMakerScheduleMock.mockReturnValue([[], true, { code: 404 }]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Schedule not available')).toBeInTheDocument();
  });

  it('renders generic error state for non-404 errors', () => {
    useMintMakerScheduleMock.mockReturnValue([[], true, { code: 403, message: 'Forbidden' }]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('renders a generic error state when the error has no numeric code', () => {
    useMintMakerScheduleMock.mockReturnValue([[], true, { message: 'Unknown error' }]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('filters schedule rows by manager name using the search filter', async () => {
    jest.useFakeTimers();

    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByText('Renovate')).toBeInTheDocument();
      expect(screen.getByText('Dependabot')).toBeInTheDocument();
    });

    const searchInput = screen
      .getByTestId('search-filter-manager')
      .querySelector<HTMLInputElement>('input');
    if (!searchInput) throw new Error('search input not found');

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(searchInput, 'renovate');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.getByText('Renovate')).toBeInTheDocument();
      expect(screen.queryByText('Dependabot')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('shows filtered empty state when filter produces no results', async () => {
    jest.useFakeTimers();

    renderWithQueryClient(<TestedComponent />);

    const searchInput = screen
      .getByTestId('search-filter-manager')
      .querySelector<HTMLInputElement>('input');
    if (!searchInput) throw new Error('search input not found');

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(searchInput, 'no-such-manager');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
