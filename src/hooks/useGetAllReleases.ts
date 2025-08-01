import React from 'react';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { K8sQueryListResourceItems } from '../k8s';
import { ReleaseModel } from '../models';
import { useNamespaceInfo } from '../shared/providers/Namespace';
import { MonitoredReleaseKind } from '../types';

/**
 * Get all the valid releases across the namespaces that you can see.
 *
 * @returns the array of the MonitoredReleaseKind.
 */
export const useGetAllReleases = () => {
  const [releases, setData] = React.useState<MonitoredReleaseKind[]>([]);
  const [loading, setloading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();

  const fetchAll = React.useCallback(async () => {
    try {
      const results: MonitoredReleaseKind[] = [];
      const namespacePromises = namespaces.map(async (namespace) => {
        const nsReleases = await K8sQueryListResourceItems<MonitoredReleaseKind[]>({
          model: ReleaseModel,
          queryOptions: { ns: namespace.metadata.name },
        });
        nsReleases.forEach((re) => {
          const componentName = re.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? '';
          if (componentName) {
            results.push(re);
          }
        });
      });
      await Promise.all(namespacePromises);
      setData(results);
    } catch (err) {
      setError(err as Error);
    } finally {
      setloading(false);
    }
  }, [namespaces]);

  React.useEffect(() => {
    if (!loaded) return;
    void fetchAll();
  }, [loaded, fetchAll]);

  return { releases, loading, error };
};
