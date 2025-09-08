import { createK8sUtilMock, createKubearchiveUtilMock } from '~/utils/test-utils';
import { HttpError } from '../../k8s/error';
import { TQueryOptions } from '../../k8s/query/type';
import { ReleaseGroupVersionKind } from '../../models';
import { K8sResourceCommon, ResourceSource, WatchK8sResource } from '../../types/k8s';
import { isKubeArchiveEnabled } from '../conditional-checks';
import { convertToKubearchiveQueryParams } from '../fetch-utils';
import { fetchResourceWithK8sAndKubeArchive } from '../resource-utils';

const mockK8sQueryGetResource = createK8sUtilMock('k8sQueryGetResource');
const mockKubearchiveQueryGetResource = createKubearchiveUtilMock('kubearchiveQueryGetResource');

jest.mock('../conditional-checks', () => ({
  isKubeArchiveEnabled: jest.fn(() => true),
}));

const mockIsKubeArchiveEnabled = isKubeArchiveEnabled as jest.MockedFunction<
  typeof isKubeArchiveEnabled
>;

describe('fetchResourceWithK8sAndKubeArchive', () => {
  const mockResourceInit = {
    model: {
      apiGroup: 'apps',
      apiVersion: 'v1',
      kind: 'Release',
      plural: 'Releases',
      namespaced: true,
    },
    queryOptions: {
      name: 'test-Release',
      ns: 'test-namespace',
    },
  };

  const mockResource: K8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'Release',
    metadata: {
      name: 'test-Release',
      namespace: 'test-namespace',
      uid: 'test-uid',
    },
  };

  const mockOptions: TQueryOptions<K8sResourceCommon> = { staleTime: Infinity };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return resource from cluster when cluster request succeeds', async () => {
    const mockResult = {
      resource: mockResource,
      source: ResourceSource.Cluster,
    };
    mockK8sQueryGetResource.mockResolvedValue(mockResource);

    const result = await fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions);

    // Assert
    expect(result).toEqual(mockResult);
    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).not.toHaveBeenCalled();
  });

  it('should return resource from kubearchive when cluster returns 404', async () => {
    const mockResult = {
      resource: mockResource,
      source: ResourceSource.Archive,
    };
    mockK8sQueryGetResource.mockRejectedValue(HttpError.fromCode(404));
    mockKubearchiveQueryGetResource.mockResolvedValueOnce(mockResource);

    const result = await fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions);

    expect(result).toEqual(mockResult);
    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
  });

  it('should throw original cluster error when both cluster and kubearchive fail with 404', async () => {
    // Arrange
    const clusterError = new HttpError('Not Found', 404, { status: 404 } as Response);
    const archiveError = new HttpError('Archive Not Found', 404, { status: 404 } as Response);
    mockK8sQueryGetResource.mockRejectedValue(clusterError);
    mockKubearchiveQueryGetResource.mockRejectedValue(archiveError);

    // Act & Assert
    await expect(fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions)).rejects.toThrow(
      'Not Found',
    );

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
  });

  it('should throw original cluster error when cluster returns 404 and kubearchive fails with different error', async () => {
    // Arrange
    const clusterError = new HttpError('Not Found', 404, { status: 404 } as Response);
    const archiveError = new HttpError('Internal Server Error', 500, { status: 500 } as Response);
    mockK8sQueryGetResource.mockRejectedValue(clusterError);
    mockKubearchiveQueryGetResource.mockRejectedValue(archiveError);

    // Act & Assert
    await expect(fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions)).rejects.toThrow(
      'Not Found',
    );

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
  });

  it('should immediately throw cluster error when it is not a 404', async () => {
    // Arrange
    const clusterError = new HttpError('Forbidden', 403, { status: 403 } as Response);
    mockK8sQueryGetResource.mockRejectedValue(clusterError);

    // Act & Assert
    await expect(fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions)).rejects.toThrow(
      'Forbidden',
    );

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).not.toHaveBeenCalled();
  });

  it('should immediately throw cluster error when it is not an HttpError', async () => {
    // Arrange
    const clusterError = new Error('Network Error');
    mockK8sQueryGetResource.mockRejectedValue(clusterError);

    // Act & Assert
    await expect(fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions)).rejects.toThrow(
      'Network Error',
    );

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).not.toHaveBeenCalled();
  });

  it('should immediately throw cluster error when HttpError response is undefined', async () => {
    // Arrange
    const clusterError = new HttpError('Bad Request', 400, undefined);
    mockK8sQueryGetResource.mockRejectedValue(clusterError);

    // Act & Assert
    await expect(fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions)).rejects.toThrow(
      'Bad Request',
    );

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).not.toHaveBeenCalled();
  });

  it('should not fetch from kubearchive when isKubeArchiveEnabled is false', async () => {
    mockIsKubeArchiveEnabled.mockReturnValue(false);
    mockK8sQueryGetResource.mockResolvedValue(mockResource);
    const mockResult = {
      resource: mockResource,
      source: ResourceSource.Cluster,
    };

    const result = await fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions);

    expect(result).toEqual(mockResult);
    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).not.toHaveBeenCalled();
  });
});

describe('convertToKubearchiveQueryParams', () => {
  const mockResourceInit: WatchK8sResource = {
    name: 'test',
    namespace: 'ns-test',
    groupVersionKind: ReleaseGroupVersionKind,
  };

  it('should return undefined when resourceInit is null/undefined', () => {
    const result = convertToKubearchiveQueryParams(undefined);
    expect(result).toBe(undefined);
  });

  it('should return labelSelector in query params if resourceInit.selector is valid', () => {
    const result = convertToKubearchiveQueryParams({
      ...mockResourceInit,
      selector: {
        matchLabels: { 'appstudio.openshift.io/application': 'testing-123' },
      },
    });
    expect(result).toMatchObject({
      ns: mockResourceInit.namespace,
      name: mockResourceInit.name,
      queryParams: {
        labelSelector: {
          matchLabels: { 'appstudio.openshift.io/application': 'testing-123' },
        },
      },
    });
  });

  it('should return query params when resourceInit.fieldSelector has value', () => {
    const result = convertToKubearchiveQueryParams({
      ...mockResourceInit,
      fieldSelector: 'name=*e2e*,creationTimestampAfter=2023-01-01T12:00:00Z',
    });
    expect(result).toMatchObject({
      ns: mockResourceInit.namespace,
      name: mockResourceInit.name,
      queryParams: {
        name: '*e2e*',
        creationTimestampAfter: '2023-01-01T12:00:00Z',
      },
    });
  });

  it('should return limit in query params if resourceInit.limit is valid', () => {
    const result = convertToKubearchiveQueryParams({
      ...mockResourceInit,
      limit: 10,
    });
    expect(result).toMatchObject({
      ns: mockResourceInit.namespace,
      name: mockResourceInit.name,
      queryParams: {
        limit: 10,
      },
    });
  });
});
