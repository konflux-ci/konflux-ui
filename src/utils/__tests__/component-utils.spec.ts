import { renderHook } from '@testing-library/react-hooks';
import {
  mockImageRepositoryWithoutVisibility,
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { ComponentModel, ImageRepositoryModel } from '~/models';
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
  getImageUrlForVisibility,
  getPipelineName,
} from '../component-utils';
import { createK8sUtilMock } from '../test-utils';

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should patch image repository visibility to private', async () => {
    k8sPatchResourceMock.mockResolvedValue(mockPrivateImageRepository);

    await updateImageRepositoryVisibility(mockPrivateImageRepository, true);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: ImageRepositoryModel,
      queryOptions: {
        name: mockPrivateImageRepository.metadata.name,
        ns: mockPrivateImageRepository.metadata.namespace,
      },
      patches: [
        {
          op: 'replace',
          path: '/spec/image/visibility',
          value: ImageRepositoryVisibility.private,
        },
      ],
    });
  });

  it('should patch image repository visibility to public', async () => {
    k8sPatchResourceMock.mockResolvedValue(mockPublicImageRepository);

    await updateImageRepositoryVisibility(mockPublicImageRepository, false);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: ImageRepositoryModel,
      queryOptions: {
        name: mockPublicImageRepository.metadata.name,
        ns: mockPublicImageRepository.metadata.namespace,
      },
      patches: [
        {
          op: 'replace',
          path: '/spec/image/visibility',
          value: ImageRepositoryVisibility.public,
        },
      ],
    });
  });

  it('should use the correct patch operation', async () => {
    k8sPatchResourceMock.mockResolvedValue(mockPublicImageRepository);

    await updateImageRepositoryVisibility(mockPublicImageRepository, true);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: expect.arrayContaining([
          expect.objectContaining({
            op: 'replace',
            path: '/spec/image/visibility',
          }),
        ]),
      }),
    );
  });

  it('should include correct query options with name and namespace', async () => {
    k8sPatchResourceMock.mockResolvedValue(mockPublicImageRepository);

    await updateImageRepositoryVisibility(mockPublicImageRepository, true);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: {
          name: mockPublicImageRepository.metadata.name,
          ns: mockPublicImageRepository.metadata.namespace,
        },
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

    k8sPatchResourceMock.mockResolvedValue(updatedImageRepository);

    const result = await updateImageRepositoryVisibility(mockPrivateImageRepository, true);

    expect(result).toEqual(updatedImageRepository);
  });

  it('should use add operation when visibility is not set', async () => {
    k8sPatchResourceMock.mockResolvedValue(mockImageRepositoryWithoutVisibility);

    await updateImageRepositoryVisibility(mockImageRepositoryWithoutVisibility, true);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            op: 'add',
            path: '/spec/image/visibility',
            value: ImageRepositoryVisibility.private,
          }),
        ],
      }),
    );
  });
});

describe('getImageUrlForVisibility', () => {
  const quayUrl = 'quay.io/namespace/repo@sha256:abc123';
  const konfluxProdUrl = 'quay.io/redhat-user-workloads/namespace/repo@sha256:abc123';
  const konfluxStageUrl = 'quay.io/redhat-user-workloads-stage/namespace/repo@sha256:abc123';
  const customProxyHost = 'custom-proxy.example.com';
  const konfluxProdProxyUrl =
    'custom-proxy.example.com/redhat-user-workloads/namespace/repo@sha256:abc123';
  const konfluxStageProxyUrl =
    'custom-proxy.example.com/redhat-user-workloads-stage/namespace/repo@sha256:abc123';

  it('should return original URL for private visibility when proxyHost is null', () => {
    expect(getImageUrlForVisibility(konfluxProdUrl, ImageRepositoryVisibility.private, null)).toBe(
      konfluxProdUrl,
    );
  });

  it('should return proxy URL for private Konflux prod URL with custom host', () => {
    expect(
      getImageUrlForVisibility(konfluxProdUrl, ImageRepositoryVisibility.private, customProxyHost),
    ).toBe(konfluxProdProxyUrl);
  });

  it('should return proxy URL for private Konflux stage URL with custom host', () => {
    expect(
      getImageUrlForVisibility(konfluxStageUrl, ImageRepositoryVisibility.private, customProxyHost),
    ).toBe(konfluxStageProxyUrl);
  });

  it('should return original URL for private user-owned repository (non-Konflux prefix)', () => {
    expect(
      getImageUrlForVisibility(quayUrl, ImageRepositoryVisibility.private, customProxyHost),
    ).toBe(quayUrl);
  });

  it('should return original URL for private user-owned repository like quay.io/user/repo', () => {
    const userRepoUrl = 'quay.io/user/repo:latest';
    expect(
      getImageUrlForVisibility(userRepoUrl, ImageRepositoryVisibility.private, customProxyHost),
    ).toBe(userRepoUrl);
  });

  it('should return original URL for public visibility with Konflux prefix', () => {
    expect(
      getImageUrlForVisibility(konfluxProdUrl, ImageRepositoryVisibility.public, customProxyHost),
    ).toBe(konfluxProdUrl);
  });

  it('should return original URL for public visibility with non-Konflux prefix', () => {
    expect(
      getImageUrlForVisibility(quayUrl, ImageRepositoryVisibility.public, customProxyHost),
    ).toBe(quayUrl);
  });

  it('should return original URL when visibility is null', () => {
    expect(getImageUrlForVisibility(quayUrl, null, customProxyHost)).toBe(quayUrl);
  });

  it('should ignore proxyHost for public visibility', () => {
    expect(
      getImageUrlForVisibility(quayUrl, ImageRepositoryVisibility.public, customProxyHost),
    ).toBe(quayUrl);
  });

  it('should handle empty string', () => {
    expect(getImageUrlForVisibility('', ImageRepositoryVisibility.private, null)).toBe(null);
  });

  it('should handle null URL', () => {
    expect(getImageUrlForVisibility(null, ImageRepositoryVisibility.private, null)).toBe(null);
  });

  it('should return original URL for private visibility when proxyHost is empty string', () => {
    expect(getImageUrlForVisibility(konfluxProdUrl, ImageRepositoryVisibility.private, '')).toBe(
      konfluxProdUrl,
    );
  });
});

describe('getPipelineName', () => {
  it('should return "-" when both pipelines are undefined', () => {
    expect(getPipelineName(undefined, undefined)).toBe('-');
  });

  it('should return "-" when pipeline has no definition keys', () => {
    expect(getPipelineName({}, undefined)).toBe('-');
  });

  it('should return pipelineref-by-name from pull-and-push', () => {
    expect(
      getPipelineName({ 'pull-and-push': { 'pipelineref-by-name': 'my-pipeline' } }, undefined),
    ).toBe('my-pipeline');
  });

  it('should return pipelinespec-from-bundle name from pull-and-push', () => {
    expect(
      getPipelineName(
        {
          'pull-and-push': {
            'pipelinespec-from-bundle': { name: 'bundle-pipeline', bundle: 'latest' },
          },
        },
        undefined,
      ),
    ).toBe('bundle-pipeline');
  });

  it('should prefer pipelineref-by-name over pipelinespec-from-bundle', () => {
    expect(
      getPipelineName(
        {
          'pull-and-push': {
            'pipelineref-by-name': 'by-name',
            'pipelinespec-from-bundle': { name: 'from-bundle', bundle: 'latest' },
          },
        },
        undefined,
      ),
    ).toBe('by-name');
  });

  it('should fall back to push definition', () => {
    expect(getPipelineName({ push: { 'pipelineref-by-name': 'push-pipeline' } }, undefined)).toBe(
      'push-pipeline',
    );
  });

  it('should fall back to pull definition', () => {
    expect(getPipelineName({ pull: { 'pipelineref-by-name': 'pull-pipeline' } }, undefined)).toBe(
      'pull-pipeline',
    );
  });

  it('should prefer pull-and-push over push and pull', () => {
    expect(
      getPipelineName(
        {
          'pull-and-push': { 'pipelineref-by-name': 'pull-and-push-pipeline' },
          push: { 'pipelineref-by-name': 'push-pipeline' },
          pull: { 'pipelineref-by-name': 'pull-pipeline' },
        },
        undefined,
      ),
    ).toBe('pull-and-push-pipeline');
  });

  it('should use defaultPipeline when versionPipeline is undefined', () => {
    expect(
      getPipelineName(undefined, { 'pull-and-push': { 'pipelineref-by-name': 'default-pl' } }),
    ).toBe('default-pl');
  });

  it('should prefer versionPipeline over defaultPipeline', () => {
    expect(
      getPipelineName(
        { 'pull-and-push': { 'pipelineref-by-name': 'version-pl' } },
        { 'pull-and-push': { 'pipelineref-by-name': 'default-pl' } },
      ),
    ).toBe('version-pl');
  });

  it('should return "-" when definition has no name fields', () => {
    expect(getPipelineName({ 'pull-and-push': {} }, undefined)).toBe('-');
  });
});
