import { commonFetchText } from '~/k8s/fetch';
import { getK8sResourceURL } from '~/k8s/k8s-utils';
import { PodModel } from '~/models/pod';
import { fetchPodContainerLog } from '~/utils/pod-logs';

jest.mock('~/k8s/fetch', () => ({ commonFetchText: jest.fn() }));
jest.mock('~/k8s/k8s-utils', () => ({ getK8sResourceURL: jest.fn(() => '/pod-log') }));

describe('fetchPodContainerLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each<[string, string | undefined, Record<string, string>]>([
    ['the live cluster', undefined, {}],
    ['a prefixed API', 'kubearchive', { pathPrefix: 'kubearchive' }],
  ])('requests one container log from %s', async (_source, pathPrefix, requestInit) => {
    jest.mocked(commonFetchText).mockResolvedValue('container output');

    await expect(
      fetchPodContainerLog('my-namespace', 'my-pod', 'step-report', pathPrefix),
    ).resolves.toBe('container output');

    expect(getK8sResourceURL).toHaveBeenCalledWith(PodModel, undefined, {
      ns: 'my-namespace',
      name: 'my-pod',
      path: 'log',
      queryParams: { container: 'step-report' },
    });
    expect(commonFetchText).toHaveBeenCalledWith('/pod-log', requestInit);
  });
});
