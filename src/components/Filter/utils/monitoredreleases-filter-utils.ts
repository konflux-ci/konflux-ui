import { PipelineRunLabel } from '~/consts/pipelinerun';
import { getReleaseStatus } from '~/hooks/useReleaseStatus';
import { MonitoredReleaseKind } from '~/types';

export type MonitoredReleasesFilterState = {
  name: string;
  status: string[];
  application: string[];
  releasePlan: string[];
  namespace: string[];
  component: string[];
};

export const filterMonitoredReleases = (
  monitoredReleases: MonitoredReleaseKind[],
  filters: MonitoredReleasesFilterState,
): MonitoredReleaseKind[] => {
  const { name, status, application, releasePlan, namespace, component } = filters;

  return monitoredReleases.filter((mr) => {
    const applicationName = mr?.metadata?.labels?.[PipelineRunLabel.APPLICATION];
    const releasePlanName = mr?.spec.releasePlan;
    const namespaceName = mr?.metadata?.namespace;
    const componentName = mr?.metadata?.labels?.[PipelineRunLabel.COMPONENT];

    // Convert undefined to string 'undefined' for consistent filtering
    const appNameForFilter = applicationName === undefined ? 'undefined' : applicationName;
    const comNameForFilter = componentName === undefined ? 'undefined' : componentName;

    return (
      (!name || mr?.metadata?.name?.indexOf(name) >= 0) &&
      (!status.length || status.includes(getReleaseStatus(mr))) &&
      (!application.length || application.includes(appNameForFilter)) &&
      (!releasePlan.length || releasePlan.includes(releasePlanName)) &&
      (!namespace.length || namespace.includes(namespaceName)) &&
      (!component.length || component.includes(comNameForFilter))
    );
  });
};
