import { renderHook } from '@testing-library/react-hooks';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { K8sQueryUpdateResource } from '~/k8s/query/fetch';
import { ComponentModel } from '~/models/component';
import { ComponentKind, ImageRepositoryVisibility } from '~/types';
import {
  isPACEnabled,
  useComponentBuildStatus,
  BUILD_STATUS_ANNOTATION,
  startNewBuild,
  BUILD_REQUEST_ANNOTATION,
  BuildRequest,
  getLastestImage,
  getConfigurationTime,
  LAST_CONFIGURATION_ANNOTATION,
  updateImageRepositoryVisibility,
} from '../component-utils';
import { createK8sUtilMock } from '../test-utils';
jest.mock('~/k8s/query/fetch', () => ({
  K8sQueryPatchResource: jest.fn(() => Promise.resolve()),
  K8sQueryUpdateResource: jest.fn(() => Promise.resolve()),
}));

const k8sPatchResourceMock = createK8sUtilMock('K8sQueryPatchResource');

describe('component-utils', () => {
  it('should detect pac enabled state', () => {
    const createComponent = (buildState: string | undefined): ComponentKind => {
      const result = {
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: buildState && JSON.stringify({ pac: { state: buildState } }),
          },
        },
      };
      return (result ?? {}) as ComponentKind;
    };
    expect(isPACEnabled(createComponent(undefined))).toBe(false);
    expect(isPACEnabled(createComponent('enabled'))).toBe(true);
    expect(isPACEnabled(createComponent('disabled'))).toBe(false);
  });

  it('should start a new PAC build when PAC is enabled', () => {
    const createComponent = (buildState: string | undefined): ComponentKind => {
      const result = {
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: buildState && JSON.stringify({ pac: { state: buildState } }),
          },
        },
      };
      return (result ?? {}) as ComponentKind;
    };

    const component = createComponent('enabled');
    void startNewBuild(component);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: component.metadata.name,
        ns: component.metadata.namespace,
      },
      patches: [
        {
          op: 'add',
          path: `/metadata/annotations/${BUILD_REQUEST_ANNOTATION.replace('/', '~1')}`,
          value: BuildRequest.triggerPACBuild,
        },
      ],
    });
  });

  it('should start a new simple build when PAC is not enabled', () => {
    const createComponent = (buildState: string | undefined): ComponentKind => {
      const result = {
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: buildState && JSON.stringify({ pac: { state: buildState } }),
          },
        },
      };
      return (result ?? {}) as ComponentKind;
    };

    const component = createComponent('disabled');
    void startNewBuild(component);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: component.metadata.name,
        ns: component.metadata.namespace,
      },
      patches: [
        {
          op: 'add',
          path: `/metadata/annotations/${BUILD_REQUEST_ANNOTATION.replace('/', '~1')}`,
          value: BuildRequest.triggerPACBuild,
        },
      ],
    });
  });

  it('should provide parsed component build status when available', () => {
    const mockComponent = {
      metadata: {
        annotations: {
          [BUILD_STATUS_ANNOTATION]:
            '{"pac":{"state":"enabled","merge-url":"example.com"},"message":"done"}',
        },
      },
    } as unknown as ComponentKind;

    expect(renderHook(() => useComponentBuildStatus(mockComponent)).result.current).toEqual({
      pac: { state: 'enabled', 'merge-url': 'example.com' },
      message: 'done',
    });
  });

  it('should return status.lastPromotedImage when lastPromotedImage is available', () => {
    const mockComponent = {
      status: {
        lastPromotedImage: 'test-url',
      },
    } as unknown as ComponentKind;

    expect(getLastestImage(mockComponent)).toEqual('test-url');
  });

  it('should return spec.containerImage when lastPromotedImage is unavailable', () => {
    const mockComponent = {
      spec: {
        containerImage: 'test-url',
      },
    } as unknown as ComponentKind;

    expect(getLastestImage(mockComponent)).toEqual('test-url');
  });

  it('should return status.lastPromotedImage when lastPromotedImage and containerImage are both available', () => {
    const mockComponent = {
      spec: {
        containerImage: 'test-url',
      },
      status: {
        lastPromotedImage: 'test-url-promoted',
      },
    } as unknown as ComponentKind;

    expect(getLastestImage(mockComponent)).toEqual('test-url-promoted');
  });

  it('should return configuration time from regular component', () => {
    const mockComponent = {
      metadata: {
        annotations: {
          [BUILD_STATUS_ANNOTATION]:
            '{"pac":{"state":"enabled","merge-url":"example.com", "configuration-time": "2025-09-11T19:36:25Z"},"message":"done"}',
        },
      },
    } as unknown as ComponentKind;
    expect(getConfigurationTime(mockComponent)).toEqual('2025-09-11T19:36:25Z');
  });

  it('should return configuration time from migration component', () => {
    const mockComponent = {
      metadata: {
        annotations: {
          [BUILD_STATUS_ANNOTATION]:
            '{"pac":{"state":"enabled","merge-url":"example.com", "configuration-time": "2025-09-11T19:36:25Z"},"message":"done"}',
          [LAST_CONFIGURATION_ANNOTATION]: JSON.stringify({
            metadata: {
              annotations: {
                [BUILD_STATUS_ANNOTATION]: JSON.stringify({
                  pac: { state: 'enabled', 'configuration-time': '2025-02-11T19:36:25Z' },
                }),
                [BUILD_REQUEST_ANNOTATION]: BuildRequest.migratePac,
              },
            },
          }),
        },
      },
    } as unknown as ComponentKind;
    expect(getConfigurationTime(mockComponent)).toEqual('2025-02-11T19:36:25Z');
  });
});

describe('updateImageRepositoryVisibility', () => {
  const K8sQueryUpdateResourceMock = K8sQueryUpdateResource as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update image repository visibility to private', async () => {
    K8sQueryUpdateResourceMock.mockResolvedValue(mockPrivateImageRepository);

    await updateImageRepositoryVisibility(mockPrivateImageRepository, true);

    expect(K8sQueryUpdateResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          spec: expect.objectContaining({
            image: expect.objectContaining({
              visibility: ImageRepositoryVisibility.private,
            }),
          }),
        }),
      }),
    );
  });

  it('should update image repository visibility to public', async () => {
    K8sQueryUpdateResourceMock.mockResolvedValue(mockPrivateImageRepository);

    await updateImageRepositoryVisibility(mockPrivateImageRepository, false);

    expect(K8sQueryUpdateResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          spec: expect.objectContaining({
            image: expect.objectContaining({
              visibility: ImageRepositoryVisibility.public,
            }),
          }),
        }),
      }),
    );
  });

  it('should preserve other image repository properties', async () => {
    const imageRepositoryWithExtraProps = {
      ...mockPublicImageRepository,
      spec: {
        image: {
          visibility: ImageRepositoryVisibility.public,
          name: 'test-image',
          repository: 'quay.io/test',
        },
      },
    };

    K8sQueryUpdateResourceMock.mockResolvedValue(imageRepositoryWithExtraProps);

    await updateImageRepositoryVisibility(imageRepositoryWithExtraProps, true);

    expect(K8sQueryUpdateResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: expect.objectContaining({
          spec: expect.objectContaining({
            image: expect.objectContaining({
              visibility: ImageRepositoryVisibility.private,
              name: 'test-image',
              repository: 'quay.io/test',
            }),
          }),
        }),
      }),
    );
  });

  it('should include correct query options', async () => {
    K8sQueryUpdateResourceMock.mockResolvedValue(mockPublicImageRepository);

    await updateImageRepositoryVisibility(mockPublicImageRepository, true);

    expect(K8sQueryUpdateResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: { ns: 'test-ns' },
      }),
    );
  });

  it('should return the updated image repository', async () => {
    const updatedImageRepository = {
      ...mockPublicImageRepository,
      spec: {
        image: {
          visibility: ImageRepositoryVisibility.private,
        },
      },
    };

    K8sQueryUpdateResourceMock.mockResolvedValue(updatedImageRepository);

    const result = await updateImageRepositoryVisibility(mockPrivateImageRepository, true);

    expect(result).toEqual(updatedImageRepository);
  });
});
