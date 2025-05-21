import React from 'react';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { K8sQueryReleaseListItems } from '../k8s';
import { ReleaseModel } from '../models';

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
 * Get all the valid releases accorss the namespaces the you can see.
 *
 * @returns the array of the Release interface.
 */
export const useGetAllReleases = (loaded, namespaces) => {
  const [releases, setData] = React.useState<Release[]>([]);

  React.useEffect(() => {
    const fetchAll = async (): Promise<Release[]> => {
      const results: Release[] = [];
      const namespacePromises = namespaces.map(async (namespace) => {
        const nsReleases = await K8sQueryReleaseListItems({
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

    fetchAll()
      .then((results) => {
        if (results.length === 0) {
          // eslint-disable-next-line no-console
          console.warn('There is no release on your monitoring namespaces');
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`Error while fetching releases`, error);
      });
  }, [loaded, namespaces]);

  return releases;
};
