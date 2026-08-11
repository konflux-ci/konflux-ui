import { act, screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { Countdown } from '../Countdown';

describe('Countdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders a dash when timestamp is empty', () => {
    renderWithQueryClientAndRouter(<Countdown timestamp="" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders a dash for an invalid timestamp', () => {
    renderWithQueryClientAndRouter(<Countdown timestamp="not-a-date" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders "now" when the target date is in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={past} />);
    expect(screen.getByTestId('countdown')).toHaveTextContent('now');
  });

  it('renders days and hours when more than a day remains', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={future} />);
    const el = screen.getByTestId('countdown');
    expect(el.textContent).toMatch(/2d \d+h \d+m/);
  });

  it('renders hours and minutes when less than a day but more than an hour remains', () => {
    const future = new Date(Date.now() + 3 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={future} />);
    const el = screen.getByTestId('countdown');
    expect(el.textContent).toMatch(/\d+h \d+m \d+s/);
  });

  it('renders minutes and seconds when less than an hour remains', () => {
    const future = new Date(Date.now() + 5 * 60 * 1000 + 30 * 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={future} />);
    const el = screen.getByTestId('countdown');
    expect(el.textContent).toMatch(/\d+m \d+s/);
  });

  it('renders only seconds when less than a minute remains', () => {
    const future = new Date(Date.now() + 45 * 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={future} />);
    const el = screen.getByTestId('countdown');
    expect(el.textContent).toMatch(/^\d+s$/);
  });

  it('updates the countdown every second', () => {
    const future = new Date(Date.now() + 10 * 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={future} />);

    const before = screen.getByTestId('countdown').textContent;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const after = screen.getByTestId('countdown').textContent;
    expect(before).not.toBe(after);
  });

  it('does not set an interval once the target date has passed', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const past = new Date(Date.now() - 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={past} />);
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('renders in simple mode without a tooltip wrapper', () => {
    const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    renderWithQueryClientAndRouter(<Countdown timestamp={future} simple />);
    expect(screen.queryByTestId('countdown')).not.toBeInTheDocument();
    expect(screen.getByText(/\d+m \d+s/)).toBeInTheDocument();
  });

  it('supports unix timestamp when isUnix is true', () => {
    const unixTs = Math.floor((Date.now() + 5 * 60 * 1000) / 1000);
    renderWithQueryClientAndRouter(<Countdown timestamp={unixTs} isUnix />);
    const el = screen.getByTestId('countdown');
    expect(el.textContent).toMatch(/\d+m \d+s/);
  });
});
