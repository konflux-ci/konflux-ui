import { createK8sUtilMock, createKubearchiveUtilMock } from '~/utils/test-utils';
import { HttpError } from '../../k8s/error';
import { TQueryOptions } from '../../k8s/query/type';
import { K8sResourceCommon, ResourceSource } from '../../types/k8s';
import { fetchResourceWithK8sAndKubeArchive } from '../resource-utils';

const mockK8sQueryGetResource = createK8sUtilMock('k8sQueryGetResource');
const mockKubearchiveQueryGetResource = createKubearchiveUtilMock('kubearchiveQueryGetResource');

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

  const mockOptions: TQueryOptions<K8sResourceCommon> = {};

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
});

// Additional edge cases focused on error propagation and object identity.
// Test framework: Jest (TypeScript via ts-jest).

describe('fetchResourceWithK8sAndKubeArchive - additional edge cases', () => {
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

  const baseResource: K8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'Release',
    metadata: {
      name: 'test-Release',
      namespace: 'test-namespace',
      uid: 'test-uid',
    },
  };

  const mockOptions: TQueryOptions<K8sResourceCommon> = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws original cluster error when cluster returns 404 and kubearchive throws a non-HttpError', async () => {
    const clusterError = new HttpError('Not Found', 404, { status: 404 } as Response);
    const archiveError = new Error('Archive network failure');

    mockK8sQueryGetResource.mockRejectedValue(clusterError);
    mockKubearchiveQueryGetResource.mockRejectedValue(archiveError);

    await expect(
      fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions),
    ).rejects.toThrow('Not Found');

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
  });

  it('throws original cluster error when cluster returns 404 and kubearchive fails with 404 and undefined response', async () => {
    const clusterError = new HttpError('Not Found', 404, { status: 404 } as Response);
    const archiveError = new HttpError('Archive Not Found', 404, undefined);

    mockK8sQueryGetResource.mockRejectedValue(clusterError);
    mockKubearchiveQueryGetResource.mockRejectedValue(archiveError);

    await expect(
      fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions),
    ).rejects.toThrow('Not Found');

    expect(mockK8sQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
    expect(mockKubearchiveQueryGetResource).toHaveBeenCalledWith(mockResourceInit, mockOptions);
  });

  it('returns the exact resource instance from cluster (no cloning)', async () => {
    const clusterResource: K8sResourceCommon = {
      ...baseResource,
      metadata: {
        ...baseResource.metadata!,
        uid: 'cluster-uid',
        annotations: { example: '1' },
      },
    };

    mockK8sQueryGetResource.mockResolvedValue(clusterResource);

    const result = await fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions);

    expect(result.source).toBe(ResourceSource.Cluster);
    expect(result.resource).toBe(clusterResource);
    expect(mockK8sQueryGetResource).toHaveBeenCalledTimes(1);
    expect(mockKubearchiveQueryGetResource).not.toHaveBeenCalled();
  });

  it('returns the exact resource instance from kubearchive (no cloning)', async () => {
    const archiveResource: K8sResourceCommon = {
      ...baseResource,
      metadata: {
        ...baseResource.metadata!,
        uid: 'archive-uid',
        labels: { from: 'archive' },
      },
    };

    mockK8sQueryGetResource.mockRejectedValue(HttpError.fromCode(404));
    mockKubearchiveQueryGetResource.mockResolvedValue(archiveResource);

    const result = await fetchResourceWithK8sAndKubeArchive(mockResourceInit, mockOptions);

    expect(result.source).toBe(ResourceSource.Archive);
    expect(result.resource).toBe(archiveResource);
    expect(mockK8sQueryGetResource).toHaveBeenCalledTimes(1);
    expect(mockKubearchiveQueryGetResource).toHaveBeenCalledTimes(1);
  });
});