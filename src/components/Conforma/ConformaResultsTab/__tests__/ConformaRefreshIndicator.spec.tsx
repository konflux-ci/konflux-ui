import { fireEvent, render, screen } from '@testing-library/react';
import type { ConformaRefreshState } from '~/types/conforma';
import { ConformaRefreshIndicator } from '../ConformaRefreshIndicator';
import '@testing-library/jest-dom';

const makeRefresh = (overrides: Partial<ConformaRefreshState> = {}): ConformaRefreshState => ({
  lastFetchedAt: 0,
  isRefreshing: false,
  hasLiveUpdatesPaused: false,
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

  it('renders the "Live updates paused" label when hasLiveUpdatesPaused is true', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ hasLiveUpdatesPaused: true })} />);

    expect(screen.getByTestId('conforma-live-updates-paused')).toBeInTheDocument();
    expect(screen.getByTestId('conforma-live-updates-paused')).toHaveTextContent(
      'Live updates paused',
    );
  });

  it('does not render the "Live updates paused" label when hasLiveUpdatesPaused is false', () => {
    render(<ConformaRefreshIndicator refresh={makeRefresh({ hasLiveUpdatesPaused: false })} />);

    expect(screen.queryByTestId('conforma-live-updates-paused')).not.toBeInTheDocument();
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

  it('is wrapped in React.memo so it is a memoized component type', () => {
    // React.memo produces an object component (not a plain function),
    // identifiable via the $$typeof Symbol used by React internals.
    expect(typeof ConformaRefreshIndicator).toBe('object');
    expect(String((ConformaRefreshIndicator as unknown as { $$typeof: symbol }).$$typeof)).toBe(
      'Symbol(react.memo)',
    );
  });
});
