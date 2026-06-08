import { testTaskRuns } from '../../components/TaskRunListView/__data__/mock-TaskRun-data';
import { sortTaskRunsByTime } from '../useTaskRuns';

describe('sortTaskRunsByTime', () => {
  it('returns empty array when task runs are undefined or empty', () => {
    expect(sortTaskRunsByTime()).toEqual([]);
    expect(sortTaskRunsByTime([])).toEqual([]);
  });

  it('sorts alphabetically by name when completion times are equal', () => {
    const sorted = sortTaskRunsByTime(testTaskRuns);

    expect(sorted.map((tr) => tr.metadata?.name)).toEqual(['example', 'example-234']);
  });

  it('sorts completed task runs before runs without completionTime', () => {
    const taskRuns = [
      testTaskRuns[0],
      {
        ...testTaskRuns[1],
        metadata: {
          ...testTaskRuns[1].metadata,
          name: 'example-task-running',
        },
        status: {
          ...testTaskRuns[1].status,
          completionTime: undefined,
        },
      },
    ];

    const sorted = sortTaskRunsByTime(taskRuns);

    expect(sorted.map((tr) => tr.metadata?.name)).toEqual(['example', 'example-task-running']);
  });

  it('sorts by completionTime with newest first', () => {
    const taskRuns = [
      {
        ...testTaskRuns[0],
        metadata: { ...testTaskRuns[0].metadata, name: 'older-run' },
        status: {
          ...testTaskRuns[0].status,
          completionTime: '2022-08-15T14:14:08Z',
        },
      },
      {
        ...testTaskRuns[1],
        metadata: { ...testTaskRuns[1].metadata, name: 'newer-run' },
        status: {
          ...testTaskRuns[1].status,
          completionTime: '2022-08-16T14:14:08Z',
        },
      },
    ];

    const sorted = sortTaskRunsByTime(taskRuns);

    expect(sorted.map((tr) => tr.metadata?.name)).toEqual(['newer-run', 'older-run']);
  });
});
