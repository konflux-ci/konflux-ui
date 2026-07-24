import { act, fireEvent, render, screen } from '@testing-library/react';
import * as dateTime from '~/shared/components/timestamp/datetime';
import type { ConformaRefreshState } from '~/types/conforma';
import { ConformaRefreshIndicator } from '../ConformaRefreshIndicator';
import '@testing-library/jest-dom';

const makeRefresh = (overrides: Partial<ConformaRefreshState> = {}): ConformaRefreshState => ({
  lastFetchedAt: 0,
  isRefreshing: false,
  onRefresh: jest.fn(),
  ...overrides,
});

describe('ConformaRefreshIndicator', () => {
  it('renders "last checked" text when lastFetchedAt is non-zero', () => {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    render(<ConformaRefreshIndicator refresh={makeRefresh({ lastFetchedAt: twoMinutesAgo })} />);

    expect(screen.getByTestId('conforma-last-checked')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-last-checked').textContent).toContain('Last checked:');
  });

  it('does not render "last checked" text when lastFetchedAt is 0', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ lastFetchedAt: 0 })} />);

    expect(screen.queryByTestId('conforma-last-checked')).not.toBeInTheDocument();
  });

  it('renders a spinner when isRefreshing is true', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ isRefreshing: true })} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render a spinner when isRefreshing is false', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ isRefreshing: false })} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', () => {
    const onRefresh = jest.fn();
    render(<ConformaRefreshIndicator refresh={makeRefresh({ onRefresh })} />);

    fireEvent.click(screen.getByTestId('conforma-refresh-button'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables the refresh button when isRefreshing is true', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ isRefreshing: true })} />);

    expect(screen.getByTestId('conforma-refresh-button')).toBeDisabled();
  });

  it('does not disable the refresh button when isRefreshing is false', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ isRefreshing: false })} />);

    expect(screen.getByTestId('conforma-refresh-button')).not.toBeDisabled();
  });

  it('shows the absolute UTC timestamp in a tooltip on hover over the "last checked" text', async () => {
    jest.useFakeTimers();
    try {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      render(
        <ConformaRefreshIndicator refresh={makeRefresh({ lastFetchedAt: twoMinutesAgo })} />,
      );

      const trigger = screen.getByTestId('conforma-last-checked');
      const expectedAbsoluteTime = dateTime.utcDateTimeFormatter.format(new Date(twoMinutesAgo));

      fireEvent.mouseEnter(trigger);
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(await screen.findByText(expectedAbsoluteTime)).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('is wrapped in React.memo so it is a memoized component type', () => {
    // React.memo produces an object component (not a plain function),
    // identifiable via the $$typeof Symbol used by React internals.
    expect(typeof ConformaRefreshIndicator).toBe('object');
    expect(String((ConformaRefreshIndicator as unknown as { $$typeof: symbol }).$$typeof)).toBe(
      'Symbol(react.memo)',
    );
  });
});
