import { commonFetchText } from '~/k8s/fetch';
import { getK8sResourceURL } from '~/k8s/k8s-utils';
import { PodModel } from '~/models/pod';

/**
 * Fetches text output for a single container in a Pod.
 */
export const fetchPodContainerLog = (
  namespace: string,
  podName: string,
  container: string,
  pathPrefix?: string,
): Promise<string> =>
  commonFetchText(
    getK8sResourceURL(PodModel, undefined, {
      ns: namespace,
      name: podName,
      path: 'log',
      queryParams: { container },
    }),
    pathPrefix ? { pathPrefix } : {},
  );
