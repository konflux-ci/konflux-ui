import { getMintMakerSchedule } from '../mintmaker-schedule-utils';

const NOW = new Date('2026-08-12T12:00:00Z').getTime();

describe('getMintMakerSchedule', () => {
  it('parses future schedule entries and sorts them by actual time', () => {
    const schedule = getMintMakerSchedule(
      {
        'renovate_scheduled_times.txt':
          '2026-09-15T10:00:00Z\n2026-09-01T10:00:00Z\n2026-08-01T10:00:00Z',
        'dependabot_scheduled_times.txt': '2026-09-08T10:00:00Z',
        'status.json': 'not a schedule',
      },
      NOW,
    );

    expect(schedule).toEqual([
      {
        manager: 'renovate',
        scheduledRuns: ['2026-09-01T10:00:00Z', '2026-09-15T10:00:00Z'],
      },
      {
        manager: 'dependabot',
        scheduledRuns: ['2026-09-08T10:00:00Z'],
      },
    ]);
  });

  it('ignores invalid, empty, and past entries', () => {
    expect(
      getMintMakerSchedule(
        {
          'invalid_scheduled_times.txt': 'not a timestamp',
          'empty_scheduled_times.txt': '\n\n',
          'past_scheduled_times.txt': '2026-08-01T10:00:00Z',
        },
        NOW,
      ),
    ).toEqual([]);
  });
});
