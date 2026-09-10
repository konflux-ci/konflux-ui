import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useMintMakerSchedule } from '~/hooks/useMintMakerSchedule';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { MintMakerSchedulePage } from '../MintMakerSchedulePage';

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
    expect(screen.queryByTestId('mintmaker-schedule-manager-card')).not.toBeInTheDocument();
  });

  it('renders a card per manager when data is available', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => {
      expect(screen.getByText('Renovate')).toBeInTheDocument();
      expect(screen.getByText('Dependabot')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('mintmaker-schedule-manager-card')).toHaveLength(2);
  });

  it('highlights the next run as the primary focus of each card', () => {
    renderWithQueryClient(<TestedComponent />);
    const cards = screen.getAllByTestId('mintmaker-schedule-manager-card');
    expect(within(cards[0]).getByTestId('mintmaker-schedule-next-run')).toBeInTheDocument();
    expect(within(cards[0]).getByTestId('mintmaker-next-label')).toHaveTextContent('Next run');
    expect(within(cards[0]).getByTestId('mintmaker-schedule-next-countdown')).toBeInTheDocument();
    expect(within(cards[0]).getByTestId('mintmaker-schedule-next-timestamp')).toBeInTheDocument();
  });

  it('lists later runs separately and excludes the next run from that list', () => {
    renderWithQueryClient(<TestedComponent />);

    const renovateCard = screen.getAllByTestId('mintmaker-schedule-manager-card')[0];
    expect(within(renovateCard).getByText('Later runs')).toBeInTheDocument();
    expect(within(renovateCard).getAllByTestId('mintmaker-schedule-later-run')).toHaveLength(2);

    const dependabotCard = screen.getAllByTestId('mintmaker-schedule-manager-card')[1];
    expect(
      within(dependabotCard).queryByTestId('mintmaker-schedule-later-runs'),
    ).not.toBeInTheDocument();
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

  it('filters schedule cards by manager name using the search filter', async () => {
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
