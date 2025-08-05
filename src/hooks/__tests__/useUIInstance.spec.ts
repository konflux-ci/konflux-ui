/* eslint-disable camelcase */
import { renderHook } from '@testing-library/react';
import { KonfluxInstanceVisibility } from '~/types/konflux-public-info';
import { mockLocation } from '../../utils/test-utils';
import { useKonfluxPublicInfo } from '../useKonfluxPublicInfo';
import {
  getEnv,
  getInternalInstance,
  useSbomUrl,
  useBombinoUrl,
  useUIInstance,
  useInstanceVisibility,
} from '../useUIInstance';

jest.mock('../useKonfluxPublicInfo');

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
    mockLocation({ hostname: 'console.redhat.com/preview' });
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
  it('should return the correct SBOM URL from KonfluxPublicInfo', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
          },
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/content/test-image-hash');
  });

  it('should return an empty string if SBOM URL is not available', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          image_controller: {
            notifications: [],
          },
          sbom_server: {
            url: '',
          },
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('');
  });

  it('should handle undefined integrations gracefully', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: undefined,
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('');
  });

  it('should handle undefined sbom_server gracefully', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          sbom_server: undefined,
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('');
  });

  it('should prioritize sbom_sha URL when both sbom_sha and imageHash are provided', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
            sbom_sha: 'https://atlas.devshift.net/sbom/sha/<PLACEHOLDER>',
          },
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash', 'test-sbom-sha');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/sha/test-sbom-sha');
  });

  it('should fallback to regular URL when sbom_sha is undefined but sbomSha parameter is provided', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
            sbom_sha: undefined,
          },
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash', 'test-sbom-sha');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/content/test-image-hash');
  });

  it('should handle empty sbom_sha gracefully', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
            sbom_sha: '',
          },
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash', 'test-sbom-sha');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/content/test-image-hash');
  });

  it('should return undefined when data is still loading', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([{}, false, null]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe(undefined);
  });

  it('should return undefined when there is an error loading data', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([{}, true, new Error('Failed to load')]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe(undefined);
  });
});

describe('useBombinoUrl', () => {
  it('should return the correct Bombino URL from KonfluxPublicInfo notifications', () => {
    (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
      {
        integrations: {
          image_controller: {
            notifications: [
              {
                title: 'SBOM-event-to-Bombino',
                event: 'repo_push',
                method: 'webhook',
                config: {
                  url: 'https://custom-bombino-url.com',
                },
              },
            ],
          },
        },
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe('https://custom-bombino-url.com');
  });

  describe('useInstanceVisibility', () => {
    it('should return the correct instance visibility', () => {
      (useKonfluxPublicInfo as jest.Mock).mockReturnValue([
        { visibility: KonfluxInstanceVisibility.PUBLIC },
        true,
        null,
      ]);

      const { result } = renderHook(() => useInstanceVisibility());
      expect(result.current).toBe(KonfluxInstanceVisibility.PUBLIC);
    });

    it('should return "public" if the instance is not specified', () => {
      (useKonfluxPublicInfo as jest.Mock).mockReturnValue([{ visibility: undefined }, true, null]);

      const { result } = renderHook(() => useInstanceVisibility());
      expect(result.current).toBe(KonfluxInstanceVisibility.PUBLIC);
    });
  });
});
