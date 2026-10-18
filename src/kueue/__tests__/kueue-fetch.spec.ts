import { commonFetchJSON } from '~/k8s';
import { KUEUE_VISIBILITY_API_PATH } from '../const';
import { fetchKueuePendingWorkloads } from '../kueue-fetch';
import { KueuePendingWorkloadsSummary } from '../types';

jest.mock('~/k8s', () => ({
  ...jest.requireActual('~/k8s'),
  commonFetchJSON: jest.fn(),
}));

const mockCommonFetchJSON = commonFetchJSON as jest.MockedFunction<typeof commonFetchJSON>;

describe('fetchKueuePendingWorkloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should GET the pending workloads for the given namespace and queue name', async () => {
    const summary: KueuePendingWorkloadsSummary = { items: [] };
    mockCommonFetchJSON.mockResolvedValue(summary);

    const result = await fetchKueuePendingWorkloads('my-tenant-ns', 'pipelines-queue');

    expect(mockCommonFetchJSON).toHaveBeenCalledWith(
      `${KUEUE_VISIBILITY_API_PATH}/namespaces/my-tenant-ns/localqueues/pipelines-queue/pendingworkloads`,
    );
    expect(result).toEqual(summary);
  });

  it('should encode special characters in the queue name', async () => {
    mockCommonFetchJSON.mockResolvedValue({ items: [] });

    await fetchKueuePendingWorkloads('my-tenant-ns', 'queue with spaces');

    expect(mockCommonFetchJSON).toHaveBeenCalledWith(
      `${KUEUE_VISIBILITY_API_PATH}/namespaces/my-tenant-ns/localqueues/queue%20with%20spaces/pendingworkloads`,
    );
  });

  it('should propagate request failures (e.g. 403 when RBAC is missing)', async () => {
    const error = new Error('Forbidden');
    mockCommonFetchJSON.mockRejectedValue(error);

    await expect(fetchKueuePendingWorkloads('my-tenant-ns', 'pipelines-queue')).rejects.toBe(
      error,
    );
  });
});
