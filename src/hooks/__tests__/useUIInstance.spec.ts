/* eslint-disable camelcase */
import { renderHook } from '@testing-library/react';
import {
  KonfluxInstanceVisibility,
  KonfluxInstanceEnvironments,
  KonfluxPublicInfo,
} from '~/types/konflux-public-info';
import { mockUseKonfluxPublicInfo } from '~/unit-test-utils';
import { useSbomUrl, useBombinoUrl, useUIInstance, useInstanceVisibility, useNotifications, useApplicationUrl } from '../useUIInstance';

const useKonfluxPublicInfoMock = mockUseKonfluxPublicInfo();

describe('useUIInstance', () => {
  it('should return environment from KonfluxPublicInfo', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      { environment: KonfluxInstanceEnvironments.STAGING, rbac: [] },
      true,
      null,
    ]);
    const { result } = renderHook(() => useUIInstance());
    expect(result.current).toEqual(KonfluxInstanceEnvironments.STAGING);
  });

  it('should default to PRODUCTION when environment is undefined', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ environment: undefined, rbac: [] }, true, null]);
    const { result } = renderHook(() => useUIInstance());
    expect(result.current).toEqual(KonfluxInstanceEnvironments.PRODUCTION);
  });

  it('should default to PRODUCTION when loading or error', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, false, null]);
    let hook = renderHook(() => useUIInstance());
    expect(hook.result.current).toEqual(KonfluxInstanceEnvironments.PRODUCTION);
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, true, new Error('err')]);
    hook = renderHook(() => useUIInstance());
    expect(hook.result.current).toEqual(KonfluxInstanceEnvironments.PRODUCTION);
  });
});

describe('useSbomUrl', () => {
  it('should return the correct SBOM URL from KonfluxPublicInfo', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/content/test-image-hash');
  });

  it('should return an empty string if SBOM URL is not available', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          image_controller: {
            notifications: [],
          },
          sbom_server: {
            url: '',
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('');
  });

  it('should handle undefined integrations gracefully', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: undefined,
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('');
  });

  it('should handle undefined sbom_server gracefully', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          sbom_server: undefined,
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe('');
  });

  it('should prioritize sbom_sha URL when both sbom_sha and imageHash are provided', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
            sbom_sha: 'https://atlas.devshift.net/sbom/sha/<PLACEHOLDER>',
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash', 'test-sbom-sha');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/sha/test-sbom-sha');
  });

  it('should fallback to regular URL when sbom_sha is undefined but sbomSha parameter is provided', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
            sbom_sha: undefined,
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash', 'test-sbom-sha');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/content/test-image-hash');
  });

  it('should handle empty sbom_sha gracefully', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          sbom_server: {
            url: 'https://atlas.devshift.net/sbom/content/<PLACEHOLDER>',
            sbom_sha: '',
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash', 'test-sbom-sha');
    expect(sbomUrl).toBe('https://atlas.devshift.net/sbom/content/test-image-hash');
  });

  it('should return undefined when data is still loading', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, false, null]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe(undefined);
  });

  it('should return undefined when there is an error loading data', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, true, new Error('Failed to load')]);

    const { result } = renderHook(() => useSbomUrl());
    const sbomUrl = result.current('test-image-hash');
    expect(sbomUrl).toBe(undefined);
  });
});

describe('useBombinoUrl', () => {
  it('should return the correct Bombino URL from KonfluxPublicInfo notifications', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
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
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe('https://custom-bombino-url.com');
  });

  it('should handle undefined integrations gracefully in useBombinoUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: undefined,
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe(undefined);
  });

  it('should handle undefined image_controller gracefully in useBombinoUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          image_controller: undefined,
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe(undefined);
  });

  it('should return empty string when no matching notification is found', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          image_controller: {
            notifications: [
              {
                title: 'Different-Title',
                event: 'repo_push',
                config: { url: 'https://different-url.com' },
                method: 'webhook',
              },
            ],
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe('');
  });

  it('should return undefined when data is loading in useBombinoUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([undefined, false, null]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe(undefined);
  });

  it('should return undefined when there is an error in useBombinoUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([undefined, true, new Error('Failed to load')]);

    const { result } = renderHook(() => useBombinoUrl());
    expect(result.current).toBe(undefined);
  });
});

describe('useApplicationUrl', () => {
  it('should return the correct application URL from KonfluxPublicInfo', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          github: {
            application_url: 'https://github.com/apps/konflux-staging',
          },
        },
        rbac: [],
      },
      true,
      undefined
    ]);

    const { result } = renderHook(() => useApplicationUrl());
    expect(result.current).toBe('https://github.com/apps/konflux-staging');
  });

  it('should handle undefined integrations gracefully in useApplicationUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: undefined,
        rbac: [],
      },
      true,
      undefined
    ]);

    const { result } = renderHook(() => useApplicationUrl());
    expect(result.current).toBe(undefined);
  });

  it('should handle undefined github gracefully in useApplicationUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          github: undefined,
        },
        rbac: [],
      },
      true,
      undefined
    ]);

    const { result } = renderHook(() => useApplicationUrl());
    expect(result.current).toBe(undefined);
  });

  it('should return undefined when data is loading in useApplicationUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, false, null]);

    const { result } = renderHook(() => useApplicationUrl());
    expect(result.current).toBe(undefined);
  });

  it('should return undefined when there is an error in useApplicationUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, true, new Error('Failed to load')]);

    const { result } = renderHook(() => useApplicationUrl());
    expect(result.current).toBe(undefined);
  });

  it('should handle undefined application_url gracefully in useApplicationUrl', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          github: {
            application_url: undefined,
          },
        },
        rbac: [],
      },
      true,
      undefined
    ]);

    const { result } = renderHook(() => useApplicationUrl());
    expect(result.current).toBe(undefined);
  });
});

describe('useNotifications', () => {
  it('should return notifications from KonfluxPublicInfo', () => {
    const mockNotifications = [
      {
        title: 'SBOM-event-to-Bombino',
        event: 'repo_push',
        method: 'webhook',
        config: { url: 'https://bombino.com' },
      },
    ];

    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          image_controller: {
            notifications: mockNotifications,
          },
        },
        rbac: [],
      },
      true,
      null,
    ]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual(mockNotifications);
  });

  it('should handle undefined integrations gracefully in useNotifications', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: undefined,
        rbac: [],
      },
      true,
      null
    ]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual([]);
  });

  it('should handle undefined image_controller gracefully in useNotifications', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          image_controller: undefined,
        },
      } as KonfluxPublicInfo,
      true,
      undefined
    ]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual([]);
  });

  it('should handle undefined notifications gracefully in useNotifications', () => {
    useKonfluxPublicInfoMock.mockReturnValue([
      {
        integrations: {
          image_controller: {
            notifications: undefined,
          },
        },
      } as KonfluxPublicInfo,
      true,
      undefined
    ]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual([]);
  });

  it('should return empty array when data is loading in useNotifications', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, false, null]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual([]);
  });

  it('should return empty array when there is an error in useNotifications', () => {
    useKonfluxPublicInfoMock.mockReturnValue([{ rbac: [] }, true, new Error('Failed to load')]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual([]);
  });

  describe('useInstanceVisibility', () => {
    it('should return the correct instance visibility', () => {
      useKonfluxPublicInfoMock.mockReturnValue([
        { visibility: KonfluxInstanceVisibility.PUBLIC, rbac: [] },
        true,
        null,
      ]);

      const { result } = renderHook(() => useInstanceVisibility());
      expect(result.current).toBe(KonfluxInstanceVisibility.PUBLIC);
    });

    it('should return "public" if the instance is not specified', () => {
      useKonfluxPublicInfoMock.mockReturnValue([{ visibility: undefined, rbac: [] }, true, null]);

      const { result } = renderHook(() => useInstanceVisibility());
      expect(result.current).toBe(KonfluxInstanceVisibility.PUBLIC);
    });
  });
});
