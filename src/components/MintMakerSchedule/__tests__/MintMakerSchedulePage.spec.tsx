import { act, screen, waitFor } from '@testing-library/react';
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
  { manager: 'renovate', nextRun: '2026-08-15T10:00:00Z' },
  { manager: 'dependabot', nextRun: '2026-08-16T10:00:00Z' },
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

  it('renders the page title and description', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('MintMaker Schedule')).toBeInTheDocument();
    expect(screen.getByText('Upcoming scheduled dependency updates')).toBeInTheDocument();
  });

  it('renders skeleton while schedule is loading', () => {
    useMintMakerScheduleMock.mockReturnValue([[], false, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('renders schedule rows when data is available', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByText('renovate')).toBeInTheDocument();
      expect(screen.getByText('dependabot')).toBeInTheDocument();
    });
  });

  it('renders all column headers', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Next run')).toBeInTheDocument();
    expect(screen.getByText('Next run in')).toBeInTheDocument();
  });

  it('renders all row columns when data is available', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.queryAllByTestId('mintmaker-schedule-manager')).toHaveLength(2);
    expect(screen.queryAllByTestId('mintmaker-schedule-next-run')).toHaveLength(2);
    expect(screen.queryAllByTestId('mintmaker-schedule-next-run-in')).toHaveLength(2);
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

  it('filters schedule rows by manager name using the search filter', async () => {
    jest.useFakeTimers();

    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByText('renovate')).toBeInTheDocument();
      expect(screen.getByText('dependabot')).toBeInTheDocument();
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
      expect(screen.getByText('renovate')).toBeInTheDocument();
      expect(screen.queryByText('dependabot')).not.toBeInTheDocument();
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

  it('uses manager field as row id', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      const rows = screen.getAllByTestId('table-row');
      expect(rows).toHaveLength(mockSchedule.length);
    });
  });
});
