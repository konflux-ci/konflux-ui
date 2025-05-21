import React from 'react';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { K8sQueryListResourceItems } from '../k8s';
import { ReleaseModel } from '../models';
import { ReleaseKind } from '../types';

export interface Release {
  releasePlan: string;
  application: string;
  tenant: string;
  name: string;
  completionTime: string;
  status: string;
  component: string;
}

/**
 * Get all the valid releases across the namespaces that you can see.
 *
 * @returns the array of the Release interface.
 */
export const useGetAllReleases = (loaded, namespaces) => {
  const [releases, setData] = React.useState<Release[]>([]);

  React.useEffect(() => {
    const fetchAll = async (): Promise<Release[]> => {
      const results: Release[] = [];
      const namespacePromises = namespaces.map(async (namespace) => {
        const nsReleases = await K8sQueryListResourceItems<ReleaseKind[]>({
          model: ReleaseModel,
          queryOptions: { ns: namespace.metadata.name },
        });
        nsReleases.forEach((re) => {
          const applicationName = re.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? '';
          const componentName = re.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? '';
          const completionTime = re.status?.completionTime ?? '';
          // Ingore the records that with empty component name inside labels
          if (componentName) {
            results.push({
              releasePlan: re.spec.releasePlan,
              application: applicationName,
              tenant: namespace.metadata.name,
              name: re.metadata.name,
              completionTime,
              status: re.status?.conditions[0].reason ?? 'Failed',
              component: componentName,
            });
          }
        });
      });
      await Promise.all(namespacePromises);
      setData(results);
      return results;
    };

    void fetchAll();
  }, [loaded, namespaces]);

  return releases;
};
