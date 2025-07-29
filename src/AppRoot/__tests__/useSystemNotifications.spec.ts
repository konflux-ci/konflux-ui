import { renderHook } from '@testing-library/react-hooks';
import {
  EmptySummaryNotificationConfigMap,
  firstValidInfoNotificationConfigMap,
  firstValidInfoNotificationJson,
  invalidDataNotificationConfigMap,
  invalidTypeNotificationConfigMap,
  missingSummaryNotificationConfigMap,
  MissingTypeNotificationConfigMap,
  noContentNotificationConfigMap,
  secondValidInfoNotificationConfigMap,
  secondValidInfoNotificationJson,
  validInfoNotification,
  validInfoNotificationConfigMap,
  validDangerNotificationConfigMap,
  validInfoNotificationJson,
  validLongSummaryNotificationConfigMap,
  validWarningNotificationConfigMap,
  validWarningNotificationJson,
  validDangerNotification,
  validWarningNotification,
  whitespaceSummaryNotificationConfigMap,
} from '~/__data__/notifications-data';
import { ConfigMap } from '~/types/configmap';
import { createK8sUtilMock } from '~/unit-test-utils/mock-k8s';
import { MAX_NOTIFICATION_SUMMARY_LENGTH, useSystemNotifications } from '../useSystemNotifications';

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSystemNotifications', () => {
  afterEach(() => {
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  it('returns empty alerts when loading', () => {
    k8sWatchMock.mockReturnValue({ data: null, isLoading: true, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      notifications: [],
      isLoading: true,
      error: null,
    });
  });

  it('returns empty alerts when there is an error', () => {
    const error = new Error('Failed to fetch');
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      notifications: [],
      isLoading: false,
      error,
    });
  });

  it('returns empty alerts when no ConfigMaps are found', () => {
    k8sWatchMock.mockReturnValue({ data: [], isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      notifications: [],
      isLoading: false,
      error: null,
    });
  });

  it('returns empty alerts when data is not an array', () => {
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      notifications: [],
      isLoading: false,
      error: null,
    });
  });

  it('parses valid alert from system-content.json', () => {
    k8sWatchMock.mockReturnValue({
      data: [validWarningNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      notifications: [
        {
          ...validWarningNotificationJson,
          component: validWarningNotificationConfigMap.metadata.name,
          title: '',
        },
      ],
      isLoading: false,
      error: null,
    });
  });

  it('handles multiple valid alerts', () => {
    const configMaps: ConfigMap[] = [
      validDangerNotificationConfigMap,
      validWarningNotificationConfigMap,
      validInfoNotificationConfigMap,
    ];

    k8sWatchMock.mockReturnValue({ data: configMaps, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.notifications).toEqual(
      expect.arrayContaining([
        validDangerNotification,
        validWarningNotification,
        validInfoNotification,
      ]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('truncates summary to MAX_NOTIFICATION_SUMMARY_LENGTH', () => {
    k8sWatchMock.mockReturnValue({
      data: [validLongSummaryNotificationConfigMap],
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications[0].summary).toHaveLength(MAX_NOTIFICATION_SUMMARY_LENGTH);
  });

  it('skips ConfigMap with invalid JSON and logs warning', () => {
    k8sWatchMock.mockReturnValue({
      data: [invalidDataNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Invalid notification-content.json in ConfigMap:',
      invalidDataNotificationConfigMap.metadata.name,
    );
  });

  it('skips ConfigMap with invalid alert type', () => {
    k8sWatchMock.mockReturnValue({
      data: [invalidTypeNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('skips ConfigMap with missing type', () => {
    k8sWatchMock.mockReturnValue({
      data: [MissingTypeNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('skips ConfigMap with empty summary', () => {
    k8sWatchMock.mockReturnValue({
      data: [EmptySummaryNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('skips ConfigMap with whitespace-only summary', () => {
    k8sWatchMock.mockReturnValue({
      data: [whitespaceSummaryNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('skips ConfigMap with missing summary', () => {
    k8sWatchMock.mockReturnValue({
      data: [missingSummaryNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('skips ConfigMap without alert-content.json', () => {
    k8sWatchMock.mockReturnValue({
      data: [noContentNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('handles mixed valid and invalid ConfigMaps', () => {
    const configMaps: ConfigMap[] = [
      validInfoNotificationConfigMap,
      invalidTypeNotificationConfigMap,
      validWarningNotificationConfigMap,
      missingSummaryNotificationConfigMap,
    ];

    k8sWatchMock.mockReturnValue({ data: configMaps, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications).toEqual(
      expect.arrayContaining([
        {
          ...validInfoNotificationJson,
          component: validInfoNotificationConfigMap.metadata.name,
          title: '',
        },
        {
          ...validWarningNotificationJson,
          component: validWarningNotificationConfigMap.metadata.name,
          title: '',
        },
      ]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('latest alerts should be shown first', () => {
    const configMaps: ConfigMap[] = [
      firstValidInfoNotificationConfigMap,
      secondValidInfoNotificationConfigMap,
    ];

    k8sWatchMock.mockReturnValue({ data: configMaps, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications).toEqual(
      expect.arrayContaining([
        {
          ...secondValidInfoNotificationJson,
          component: secondValidInfoNotificationConfigMap.metadata.name,
        },
        {
          ...firstValidInfoNotificationJson,
          component: firstValidInfoNotificationConfigMap.metadata.name,
        },
      ]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
