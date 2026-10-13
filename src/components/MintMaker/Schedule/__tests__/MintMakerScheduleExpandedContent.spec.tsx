import { screen, within } from '@testing-library/react';
import type { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { MintMakerScheduleExpandedContent } from '../MintMakerScheduleExpandedContent';

const renderExpandedContent = (scheduledRuns: string[]) => {
  const entry: MintMakerScheduleEntry = {
    manager: 'renovate',
    scheduledRuns,
  };

  return renderWithQueryClientAndRouter(<MintMakerScheduleExpandedContent entry={entry} />);
};

describe('MintMakerScheduleExpandedContent', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-12T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['2026-08-12T18:00:00Z', 'Today'],
    ['2026-08-13T18:00:00Z', 'Tomorrow'],
    ['2026-08-15T18:00:00Z', 'In 3 days'],
    ['2026-08-11T18:00:00Z', 'Earlier'],
  ])('labels a run on %s as %s', (timestamp, expectedLabel) => {
    renderExpandedContent(['2026-08-10T18:00:00Z', timestamp]);

    expect(
      within(screen.getByTestId('mintmaker-schedule-future-runs')).getByTestId(
        'mintmaker-schedule-future-run-relative',
      ),
    ).toHaveTextContent(expectedLabel);
  });

  it('uses a fallback label for an invalid future run timestamp', () => {
    renderExpandedContent(['2026-08-10T18:00:00Z', 'not-a-timestamp']);

    expect(
      within(screen.getByTestId('mintmaker-schedule-future-runs')).getByTestId(
        'mintmaker-schedule-future-run-relative',
      ),
    ).toHaveTextContent('-');
  });

  it('shows an empty message when there are no future runs', () => {
    renderExpandedContent(['2026-08-12T18:00:00Z']);

    expect(screen.getByText('No future runs scheduled.')).toBeInTheDocument();
    expect(screen.queryByTestId('mintmaker-schedule-future-runs')).not.toBeInTheDocument();
  });
});
