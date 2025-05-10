import { renderHook } from '@testing-library/react-hooks';
import yaml from 'js-yaml';
import { createK8sUtilMock } from '~/utils/test-utils';
import { useBanner } from '../useBanner';

jest.mock('dompurify', () => ({
  sanitize: jest.fn((x) => x),
}));

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

beforeEach(() => {
  jest.clearAllMocks();
});

it('returns null while loading', () => {
  k8sWatchMock.mockReturnValue({ data: null, isLoading: true, error: null });
  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns null on error', () => {
  k8sWatchMock.mockReturnValue({ data: null, isLoading: false, error: new Error('err') });
  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns null if yamlContent is missing', () => {
  k8sWatchMock.mockReturnValue({ data: {}, isLoading: false, error: null });
  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns null if yamlContent is not a string', () => {
  k8sWatchMock.mockReturnValue({
    data: { 'banner-content.yaml': 123 },
    isLoading: false,
    error: null,
  });
  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns null if banner config is invalid', () => {
  k8sWatchMock.mockReturnValue({
    data: { 'banner-content.yaml': 'invalid yaml' },
    isLoading: false,
    error: null,
  });
  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns banner config if valid', () => {
  const validYaml = `
    enable: true
    summary: "Valid banner summary"
    type: info
  `;
  k8sWatchMock.mockReturnValue({
    data: { 'banner-content.yaml': validYaml },
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  const expected = yaml.load(validYaml);
  expect(result.current).toEqual(expected);
});

it('returns null if banner is outside of time range', () => {
  const validYaml = `
    enable: true
    summary: "Valid banner summary"
    type: info
    startTime: "2023-01-01T00:00:00Z"
    endTime: "2023-12-31T23:59:59Z"
  `;
  k8sWatchMock.mockReturnValue({
    data: { 'banner-content.yaml': validYaml },
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns banner if within time range', () => {
  const validYaml = `
    enable: true
    summary: "Valid banner summary"
    type: info
    startTime: "2025-01-01T00:00:00Z"
    endTime: "2125-12-31T23:59:59Z"
  `;
  k8sWatchMock.mockReturnValue({
    data: { 'banner-content.yaml': validYaml },
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  const expected = yaml.load(validYaml);
  expect(result.current).toEqual(expected);
});

it('returns null if banner is disabled', () => {
  const validYaml = `
    enable: false
    summary: "Valid banner summary"
    type: info
  `;
  k8sWatchMock.mockReturnValue({
    data: { 'banner-content.yaml': validYaml },
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});
