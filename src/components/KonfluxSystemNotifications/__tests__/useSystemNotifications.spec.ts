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
  thirdValidDangerNotificationJson,
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
  mockConfigMapWithArray,
  mockConfigMapWithMixedDataInArray,
  thirdValidDangerNotificationConfigMap,
  longSummary,
  futureTimestampNotificationConfigMap,
  invalidTimestampNotificationConfigMap,
  missingActiveTimestampNotificationConfigMap,
  missingActiveTimestampNotificationJson,
} from '~/components/KonfluxSystemNotifications/__data__/notifications-data';
import { ConfigMap } from '~/types/configmap';
import { createK8sUtilMock } from '~/unit-test-utils/mock-k8s';
import { useSystemNotifications } from '../useSystemNotifications';

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

  it('parses valid alert from notification-content.json', () => {
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

  it('Keep long summary as it is', () => {
    k8sWatchMock.mockReturnValue({
      data: [validLongSummaryNotificationConfigMap],
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications[0].summary).toBe(longSummary);
  });

  it('skips ConfigMap with invalid JSON and logs warning', () => {
    k8sWatchMock.mockReturnValue({
      data: [invalidDataNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
    expect(mockConsoleWarn).toHaveBeenNthCalledWith(
      1,
      'Invalid notification-content.json in ConfigMap: test-alert',
    );
    expect(mockConsoleWarn).toHaveBeenNthCalledWith(
      2,
      'Parsing error details:',
      'Unexpected token \'i\', "invalid json content" is not valid JSON',
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

  it('skips ConfigMap without alert-content.json and logs warning', () => {
    k8sWatchMock.mockReturnValue({
      data: [noContentNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'No notification-content.json found in ConfigMap:',
      noContentNotificationConfigMap.metadata.name,
    );
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
    const { activeTimestamp: activeTimestampSecond, ...restSecond } =
      secondValidInfoNotificationJson;
    const { activeTimestamp: activeTimestampFirst, ...restFirst } = firstValidInfoNotificationJson;
    expect(result.current.notifications).toEqual([
      {
        ...restSecond,
        created: activeTimestampSecond,
        component: secondValidInfoNotificationConfigMap.metadata.name,
      },
      {
        ...restFirst,
        created: activeTimestampFirst,
        component: firstValidInfoNotificationConfigMap.metadata.name,
      },
    ]),
      expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle multiple notifications in a single configmap', () => {
    k8sWatchMock.mockReturnValue({
      data: [mockConfigMapWithArray],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());
    expect(result.current.notifications).toHaveLength(2);
    const { activeTimestamp: activeTimestampSecond, ...restSecond } =
      secondValidInfoNotificationJson;
    const { activeTimestamp: activeTimestampFirst, ...restFirst } = firstValidInfoNotificationJson;
    expect(result.current.notifications).toEqual([
      {
        ...restSecond,
        created: activeTimestampSecond,
        component: mockConfigMapWithArray.metadata.name,
      },
      {
        ...restFirst,
        created: activeTimestampFirst,
        component: mockConfigMapWithArray.metadata.name,
      },
    ]);
  });

  it('should filter out invalid notifications from array while keeping valid ones', () => {
    k8sWatchMock.mockReturnValue({
      data: [mockConfigMapWithMixedDataInArray],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(2);
    const { activeTimestamp: activeTimestampSecond, ...restSecond } =
      secondValidInfoNotificationJson;
    const { activeTimestamp: activeTimestampFirst, ...restFirst } = firstValidInfoNotificationJson;
    expect(result.current.notifications).toEqual([
      {
        ...restSecond,
        component: mockConfigMapWithMixedDataInArray.metadata.name,
        created: activeTimestampSecond,
      },
      {
        ...restFirst,
        component: mockConfigMapWithMixedDataInArray.metadata.name,
        created: activeTimestampFirst,
      },
    ]);
  });

  it('should handle mix of single notification and array notifications from different configmaps', () => {
    k8sWatchMock.mockReturnValue({
      data: [thirdValidDangerNotificationConfigMap, mockConfigMapWithMixedDataInArray],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(3);
    const { activeTimestamp: activeTimestampSecond, ...restSecond } =
      secondValidInfoNotificationJson;
    const { activeTimestamp: activeTimestampFirst, ...restFirst } = firstValidInfoNotificationJson;
    expect(result.current.notifications).toEqual([
      {
        ...thirdValidDangerNotificationJson,
        component: thirdValidDangerNotificationConfigMap.metadata.name,
        created: thirdValidDangerNotificationConfigMap.metadata.creationTimestamp,
      },
      {
        ...restSecond,
        component: mockConfigMapWithMixedDataInArray.metadata.name,
        created: activeTimestampSecond,
      },
      {
        ...restFirst,
        component: mockConfigMapWithMixedDataInArray.metadata.name,
        created: activeTimestampFirst,
      },
    ]);
  });

  it('should filter out notifications with future timestamps', () => {
    k8sWatchMock.mockReturnValue({
      data: [futureTimestampNotificationConfigMap, validInfoNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    // Should only include the valid notification, not the future one
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].component).toBe(
      validInfoNotificationConfigMap.metadata.name,
    );
  });

  it('should filter out notifications with invalid timestamps', () => {
    k8sWatchMock.mockReturnValue({
      data: [invalidTimestampNotificationConfigMap, validWarningNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    // Should only include the valid notification, not the invalid timestamp one
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].component).toBe(
      validWarningNotificationConfigMap.metadata.name,
    );
  });

  it('should use ConfigMap timestamp when activeTimestamp is missing', () => {
    k8sWatchMock.mockReturnValue({
      data: [missingActiveTimestampNotificationConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual({
      ...missingActiveTimestampNotificationJson,
      component: missingActiveTimestampNotificationConfigMap.metadata.name,
      created: missingActiveTimestampNotificationConfigMap.metadata.creationTimestamp,
      title: '',
    });
  });

  it('should filter out notifications when both activeTimestamp and ConfigMap timestamp are missing', () => {
    const configMapWithoutTimestamp = {
      ...missingActiveTimestampNotificationConfigMap,
      metadata: {
        ...missingActiveTimestampNotificationConfigMap.metadata,
        creationTimestamp: undefined,
      },
    };

    k8sWatchMock.mockReturnValue({
      data: [configMapWithoutTimestamp],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });
});
