import React from 'react';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { K8sQueryListResourceItems } from '../k8s';
import { ReleaseModel } from '../models';
import { MonitoredReleaseKind } from '../types';

/**
 * Get all the valid releases across the namespaces that you can see.
 *
 * @returns the array of the MonitoredReleaseKind.
 */
export const useGetAllReleases = (loaded, namespaces) => {
  const [releases, setData] = React.useState<MonitoredReleaseKind[]>([]);
  const [loading, setloading] = React.useState(true);

  React.useEffect(() => {
    const fetchAll = async (): Promise<MonitoredReleaseKind[]> => {
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
      setloading(false);
      return results;
    };

    void fetchAll();
  }, [loaded, namespaces]);

  return { releases, loading };
};
