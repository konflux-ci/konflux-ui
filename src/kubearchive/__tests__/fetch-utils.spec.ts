import { createK8sUtilMock, createKubearchiveUtilMock } from '~/utils/test-utils';
import { HttpError } from '../../k8s/error';
import { TQueryOptions } from '../../k8s/query/type';
import { K8sResourceCommon, ResourceSource } from '../../types/k8s';
import { isKubeArchiveEnabled } from '../conditional-checks';
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
