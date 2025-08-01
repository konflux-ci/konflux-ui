import { renderHook } from '@testing-library/react-hooks';
import { ConfigMap } from '~/types/configmap';
import { createK8sUtilMock } from '~/unit-test-utils/mock-k8s';
import {
  validWarningAlertsJson,
  validWarningAlertsConfigMap,
  validInfoAlertsConfigMap,
  validInfoAlertsJson,
  validLongSummaryAlertsConfigMap,
  invalidDataSystemAlertsConfigMap,
  invalidTypeSystemAlertsConfigMap,
  MissingTypeSystemAlertsConfigMap,
  EmptySummarySystemALertsConfigMap,
  whitespaceSummarySystemALertsConfigMap,
  missingSummarySystemAlertsConfigMap,
  noContentSystemAlertsConfigMap,
  firstValidInfoAlertsConfigMap,
  secondValidInfoAlertsConfigMap,
  secondValidInfoAlertsJson,
  firstValidInfoAlertsJson,
} from '../__data__/alerts-data';
import { MAX_ALERT_SUMMARY_LENGTH, useSystemNotifications } from '../useSystemNotifications';

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
      alerts: [],
      isLoading: true,
      error: null,
    });
  });

  it('returns empty alerts when there is an error', () => {
    const error = new Error('Failed to fetch');
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      alerts: [],
      isLoading: false,
      error,
    });
  });

  it('returns empty alerts when no ConfigMaps are found', () => {
    k8sWatchMock.mockReturnValue({ data: [], isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      alerts: [],
      isLoading: false,
      error: null,
    });
  });

  it('returns empty alerts when data is not an array', () => {
    k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      alerts: [],
      isLoading: false,
      error: null,
    });
  });

  it('parses valid alert from system-content.json', () => {
    k8sWatchMock.mockReturnValue({
      data: [validWarningAlertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current).toEqual({
      alerts: [validWarningAlertsJson],
      isLoading: false,
      error: null,
    });
  });

  it('handles multiple valid alerts', () => {
    const configMaps: ConfigMap[] = [validWarningAlertsConfigMap, validInfoAlertsConfigMap];

    k8sWatchMock.mockReturnValue({ data: configMaps, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(2);
    expect(result.current.alerts).toEqual(
      expect.arrayContaining([validWarningAlertsJson, validInfoAlertsJson]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('truncates summary to MAX_ALERT_SUMMARY_LENGTH', () => {
    k8sWatchMock.mockReturnValue({
      data: [validLongSummaryAlertsConfigMap],
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts[0].summary).toHaveLength(MAX_ALERT_SUMMARY_LENGTH);
  });

  it('skips ConfigMap with invalid JSON and logs warning', () => {
    k8sWatchMock.mockReturnValue({
      data: [invalidDataSystemAlertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Invalid alert-content.json in ConfigMap:',
      invalidDataSystemAlertsConfigMap.metadata.name,
    );
  });

  it('skips ConfigMap with invalid alert type', () => {
    k8sWatchMock.mockReturnValue({
      data: [invalidTypeSystemAlertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
  });

  it('skips ConfigMap with missing type', () => {
    k8sWatchMock.mockReturnValue({
      data: [MissingTypeSystemAlertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
  });

  it('skips ConfigMap with empty summary', () => {
    k8sWatchMock.mockReturnValue({
      data: [EmptySummarySystemALertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
  });

  it('skips ConfigMap with whitespace-only summary', () => {
    k8sWatchMock.mockReturnValue({
      data: [whitespaceSummarySystemALertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
  });

  it('skips ConfigMap with missing summary', () => {
    k8sWatchMock.mockReturnValue({
      data: [missingSummarySystemAlertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
  });

  it('skips ConfigMap without alert-content.json', () => {
    k8sWatchMock.mockReturnValue({
      data: [noContentSystemAlertsConfigMap],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(0);
  });

  it('handles mixed valid and invalid ConfigMaps', () => {
    const configMaps: ConfigMap[] = [
      validInfoAlertsConfigMap,
      invalidTypeSystemAlertsConfigMap,
      validWarningAlertsConfigMap,
      missingSummarySystemAlertsConfigMap,
    ];

    k8sWatchMock.mockReturnValue({ data: configMaps, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(2);
    expect(result.current.alerts).toEqual(
      expect.arrayContaining([validInfoAlertsJson, validWarningAlertsJson]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('latest alerts should be shown first', () => {
    const configMaps: ConfigMap[] = [firstValidInfoAlertsConfigMap, secondValidInfoAlertsConfigMap];

    k8sWatchMock.mockReturnValue({ data: configMaps, isLoading: false, error: null });

    const { result } = renderHook(() => useSystemNotifications());

    expect(result.current.alerts).toHaveLength(2);
    expect(result.current.alerts).toEqual(
      expect.arrayContaining([secondValidInfoAlertsJson, firstValidInfoAlertsJson]),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
