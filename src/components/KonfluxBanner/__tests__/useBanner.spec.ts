import { renderHook } from '@testing-library/react';
import yaml from 'js-yaml';
import {
  mockedBannerListWithSeveralActive,
  mockedInvalidBannerConfig,
  mockedInvalidMonthlyBannerConfig,
  mockedInvalidWeeklyBannerConfig,
  mockedMonthlyBannerConfig,
  mockedObsoletedBannerConfig,
  mockedObsoletedMonthlyBannerConfigWithTimeRange,
  mockedOneTimeBannerConfigWithTime,
  mockedValidBannerConfig,
  mockedValidBannerConfigWithNoTimeRange,
  mockedValidMonthlyBannerConfigWithInvalidTimeRange,
  mockedWeeklyBannerConfig,
} from '~/components/KonfluxBanner/__data__/banner-data';
import { createK8sUtilMock } from '~/utils/test-utils';
import { useBanner } from '../useBanner';

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useBanner hook', () => {
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

  it('returns banner config if valid and without no time range', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedValidBannerConfigWithNoTimeRange,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    const expected = yaml.load(
      mockedValidBannerConfigWithNoTimeRange.data['banner-content.yaml'],
    )[0];
    expect(result.current).toEqual({ type: expected.type, summary: expected.summary });
  });

  it('returns one time banner if content is valid and with time range)', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedValidBannerConfig,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    const expected = yaml.load(mockedValidBannerConfig.data['banner-content.yaml'])[0];
    expect(result.current).toEqual(expected);
  });

  it('returns banner for one-time banner with time range', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedOneTimeBannerConfigWithTime,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    const expected = yaml.load(mockedOneTimeBannerConfigWithTime.data['banner-content.yaml'])[0];
    expect(result.current).toEqual(expected);
  });

  it('returns null for one-time banner outside of time range', () => {
    // To test this you'd mock a banner with year/month/dayOfMonth in the past or future and a time range that excludes now.
    // Example, we reuse mockedObsoletedBannerConfig or create new one.
    k8sWatchMock.mockReturnValue({
      data: mockedObsoletedBannerConfig,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    expect(result.current).toBeNull();
  });

  // --- Weekly ---
  it('returns weekly banner when today is the correct day and time', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedWeeklyBannerConfig,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    const expected = yaml.load(mockedWeeklyBannerConfig.data['banner-content.yaml'])[0];
    expect(result.current).toEqual(expected);
  });

  it('returns null for weekly banner when today is not the matching day', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedInvalidWeeklyBannerConfig,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    expect(result.current).toBeNull();
  });

  // --- Monthly ---
  it('returns monthly banner when today is the correct date and time', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedMonthlyBannerConfig,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    const expected = yaml.load(mockedMonthlyBannerConfig.data['banner-content.yaml'])[0];
    expect(result.current).toEqual(expected);
  });

  it('returns null for monthly banner when banner is out of time range', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedValidMonthlyBannerConfigWithInvalidTimeRange,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    expect(result.current).toBeNull();
  });

  it('returns null for monthly banner when banner is obsolete', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedObsoletedMonthlyBannerConfigWithTimeRange,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    expect(result.current).toBeNull();
  });

  it('returns null for monthly banner when today is not the matching date', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedInvalidMonthlyBannerConfig,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    expect(result.current).toBeNull();
  });

  it('returns the latest active one when there are some banners', () => {
    k8sWatchMock.mockReturnValue({
      data: mockedBannerListWithSeveralActive,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useBanner());
    const expected = yaml.load(mockedBannerListWithSeveralActive.data['banner-content.yaml'])[1];
    expect(result.current).toEqual(expected);
  });
});
