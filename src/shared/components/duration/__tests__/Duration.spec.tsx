import { act, render } from '@testing-library/react';
import Duration from '../Duration';

describe('Duration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should display "-" when startTime is not provided', () => {
    const { container } = render(<Duration />);
    expect(container.textContent).toBe('-');
  });

  it('should display static duration when both startTime and endTime are provided', () => {
    const { container } = render(
      <Duration startTime="2022-11-28T12:00:00Z" endTime="2022-11-28T12:05:30Z" />,
    );
    expect(container.textContent).toBe('5 minutes 30 seconds');
  });

  it('should update duration for in-progress runs without endTime', () => {
    const now = new Date('2022-11-28T12:05:00Z').getTime();
    jest.setSystemTime(now);

    const { container } = render(<Duration startTime="2022-11-28T12:00:00Z" />);

    const initialText = container.textContent;
    expect(initialText).toBe('5 minutes');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(container.textContent).toBe('5 minutes 5 seconds');
  });

  it('should stop updating when endTime is provided', () => {
    const { container } = render(
      <Duration startTime="2022-11-28T12:00:00Z" endTime="2022-11-28T12:02:00Z" />,
    );

    const initialText = container.textContent;

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(container.textContent).toBe(initialText);
  });

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<Duration startTime="2022-11-28T12:00:00Z" />);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});
