import { renderHook } from '@testing-library/react';
import { mockLocation } from '../../utils/test-utils';
import { getEnv, getInternalInstance, useSbomUrl, useUIInstance } from '../useUIInstance';

jest.mock('../useUIInstance', () => {
  const actual = jest.requireActual('../useUIInstance');
  return {
    ...actual,
    getEnv: jest.fn(),
  };
});

const mockEnv = getEnv as jest.Mock;

describe('getInternalInstance', () => {
  it('should return correct env for internal instance host', () => {
    mockLocation({ hostname: 'konflux.apps.stone-prod-p01.wcfb.p1.openshiftapps.com' });
    expect(getInternalInstance()).toEqual('prod');
    mockLocation({ hostname: 'rhtap.apps.rosa.stone-stage-p01.apys.p3.openshiftapps.com' });
    expect(getInternalInstance()).toEqual('stage');
    mockLocation({ hostname: 'abcd.com' });
    expect(getInternalInstance()).toEqual(undefined);
  });
});

describe('useUIInstance', () => {
  it('should return correct environment', () => {
    mockEnv.mockReturnValue('prod');
    mockLocation({ hostname: 'console.redhat.com/preview/application-pipeline' });
    const { result } = renderHook(() => useUIInstance());
    expect(result.current).toEqual('prod');
  });

  it('should return correct env for internal instance', () => {
    mockEnv.mockReturnValue('prod');
    mockLocation({ hostname: 'rhtap.apps.rosa.stone-stage-p01.apys.p3.openshiftapps.com' });
    const { result, rerender } = renderHook(() => useUIInstance());
    expect(result.current).toEqual('stage');
    mockEnv.mockReturnValue('qa');
    mockLocation({ hostname: 'konflux.apps.stone-prod-p01.wcfb.p1.openshiftapps.com' });
    rerender();
    expect(result.current).toEqual('prod');
  });
  it('should return correct environment when not internal instance', () => {
    mockEnv.mockReturnValue('dev');
    mockLocation({ hostname: 'not.internal.instance.com' });
    const { result } = renderHook(() => useUIInstance());
    // [TODO]: fix this test once we have a valid getEnv
    expect(result.current).toEqual('prod');
  });
});

describe('useSbomUrl', () => {
  it('should return correct SBOM url based for prod env', () => {
    mockEnv.mockReturnValue('prod');
    const { result } = renderHook(() => useSbomUrl());
    expect(result.current('image-hash-prod')).toEqual(
      'https://atlas.devshift.net/sbom/content/image-hash-prod',
    );
  });

  it('should return correct SBOM url based for stage env', () => {
    mockEnv.mockClear().mockReturnValue('stage');
    const { result } = renderHook(() => useSbomUrl());
    expect(result.current('image-hash-stage')).toEqual(
      // [TODO]: fix this test once we have a valid getEnv
      'https://atlas.devshift.net/sbom/content/image-hash-stage',
    );
  });
});
