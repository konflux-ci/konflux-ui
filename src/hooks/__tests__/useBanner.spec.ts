import { renderHook } from '@testing-library/react-hooks';
import yaml from 'js-yaml';
import { createK8sUtilMock } from '~/utils/test-utils';
import {
  mockedDisabledBannerConfig,
  mockedInvalidBannerConfig,
  mockedObsoletedBannerConfig,
  mockedValidBannerConfig,
  mockedValidBannerConfigWithNoTimeRange,
} from '../__data__/mock-data';
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
    data: mockedInvalidBannerConfig,
    isLoading: false,
    error: null,
  });
  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns banner config if valid', () => {
  const validYaml = mockedValidBannerConfigWithNoTimeRange.data['banner-content.yaml'];

  k8sWatchMock.mockReturnValue({
    data: mockedValidBannerConfigWithNoTimeRange,
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  const expected = yaml.load(validYaml);
  expect(result.current).toEqual(expected);
});

it('returns null if banner is outside of time range', () => {
  k8sWatchMock.mockReturnValue({
    data: mockedObsoletedBannerConfig,
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});

it('returns banner if within time range', () => {
  const validYaml = mockedValidBannerConfig.data['banner-content.yaml'];

  k8sWatchMock.mockReturnValue({
    data: mockedValidBannerConfig,
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  const expected = yaml.load(validYaml);
  expect(result.current).toEqual(expected);
});

it('returns null if banner is disabled', () => {
  k8sWatchMock.mockReturnValue({
    data: mockedDisabledBannerConfig,
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useBanner());
  expect(result.current).toBeNull();
});
