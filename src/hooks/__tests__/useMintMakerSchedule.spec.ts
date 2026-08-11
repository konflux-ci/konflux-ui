import { renderHook } from '@testing-library/react';
import { MINTMAKER_NAMESPACE, MINTMAKER_SCHEDULE_CONFIGMAP } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s/hooks';
import { useMintMakerSchedule } from '../useMintMakerSchedule';

jest.mock('~/k8s/hooks', () => ({
  useK8sWatchResource: jest.fn(),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

// Use stable future/past timestamps relative to a fixed "now" so tests are
// not sensitive to when they run. The hook uses Date.now() internally, so we
// freeze time to make assertions deterministic.
const FIXED_NOW = new Date('2026-08-12T12:00:00Z').getTime();
const FUTURE_1 = '2026-09-01T10:00:00Z';
const FUTURE_2 = '2026-09-08T10:00:00Z';
const FUTURE_3 = '2026-09-15T10:00:00Z';
const PAST_1 = '2026-08-01T10:00:00Z';
const PAST_2 = '2026-08-05T10:00:00Z';

const makeConfigMap = (data: Record<string, string>) => ({
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: MINTMAKER_SCHEDULE_CONFIGMAP,
    namespace: MINTMAKER_NAMESPACE,
  },
  data,
});

describe('useMintMakerSchedule', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('calls useK8sWatchResource with the correct resource config', () => {
    useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderHook(() => useMintMakerSchedule());

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: MINTMAKER_NAMESPACE,
        name: MINTMAKER_SCHEDULE_CONFIGMAP,
        isList: false,
      }),
      expect.anything(),
    );
  });

  it('returns empty schedule and loaded=false while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule, loaded, error] = result.current;

    expect(schedule).toEqual([]);
    expect(loaded).toBe(false);
    expect(error).toBeNull();
  });

  it('returns empty schedule when configmap has no data', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({}),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule, loaded, error] = result.current;

    expect(schedule).toEqual([]);
    expect(loaded).toBe(true);
    expect(error).toBeNull();
  });

  it('parses schedule entries from configmap data', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({
        'renovate_scheduled_times.txt': `${FUTURE_1}\n${FUTURE_2}`,
        'dependabot_scheduled_times.txt': FUTURE_1,
      }),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule] = result.current;

    expect(schedule).toHaveLength(2);
    expect(schedule.find((e) => e.manager === 'renovate')).toEqual({
      manager: 'renovate',
      nextRun: FUTURE_1,
    });
    expect(schedule.find((e) => e.manager === 'dependabot')).toEqual({
      manager: 'dependabot',
      nextRun: FUTURE_1,
    });
  });

  it('picks the first future timestamp, skipping past ones', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({
        'renovate_scheduled_times.txt': `${PAST_1}\n${PAST_2}\n${FUTURE_1}\n${FUTURE_2}`,
      }),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule] = result.current;

    expect(schedule).toHaveLength(1);
    expect(schedule[0].nextRun).toBe(FUTURE_1);
  });

  it('excludes a manager entirely when all its timestamps are in the past', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({
        'stale_scheduled_times.txt': `${PAST_1}\n${PAST_2}`,
        'renovate_scheduled_times.txt': FUTURE_1,
      }),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule] = result.current;

    expect(schedule).toHaveLength(1);
    expect(schedule[0].manager).toBe('renovate');
  });

  it('skips configmap keys that do not end with the schedule suffix', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({
        'renovate_scheduled_times.txt': FUTURE_1,
        'last-update': FUTURE_1,
        'status.json': '{"ok": true}',
      }),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule] = result.current;

    expect(schedule).toHaveLength(1);
    expect(schedule[0].manager).toBe('renovate');
  });

  it('skips entries with empty timestamps', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({
        'empty_scheduled_times.txt': '\n\n',
        'renovate_scheduled_times.txt': FUTURE_1,
      }),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule] = result.current;

    expect(schedule).toHaveLength(1);
    expect(schedule[0].manager).toBe('renovate');
  });

  it('sorts entries by nextRun ascending', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: makeConfigMap({
        'renovate_scheduled_times.txt': FUTURE_3,
        'dependabot_scheduled_times.txt': FUTURE_1,
        'pip_scheduled_times.txt': FUTURE_2,
      }),
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule] = result.current;

    expect(schedule.map((e) => e.manager)).toEqual(['dependabot', 'pip', 'renovate']);
  });

  it('returns the error and loaded=true when fetch fails', () => {
    const err = { code: 403, message: 'Forbidden' };
    useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: err });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule, loaded, error] = result.current;

    expect(schedule).toEqual([]);
    expect(loaded).toBe(true);
    expect(error).toBe(err);
  });

  it('returns empty schedule and error when configmap is not found', () => {
    const err = { code: 404, message: 'Not found' };
    useK8sWatchResourceMock.mockReturnValue({ data: undefined, isLoading: false, error: err });
    const { result } = renderHook(() => useMintMakerSchedule());
    const [schedule, loaded, error] = result.current;

    expect(schedule).toEqual([]);
    expect(loaded).toBe(true);
    expect(error).toBe(err);
  });
});
