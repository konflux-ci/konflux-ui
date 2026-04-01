import { PipelineRunLabel } from '~/consts/pipelinerun';
import { getReleaseStatus } from '~/hooks/useReleaseStatus';
import { MonitoredReleaseKind } from '~/types';

export type MonitoredReleasesFilterState = {
  name: string;
  statuses: string[];
  applications: string[];
  releasePlans: string[];
  namespaces: string[];
  components: string[];
  products: string[];
  productVersions: string[];
  showLatest: boolean;
};

export const filterMonitoredReleases = (
  monitoredReleases: MonitoredReleaseKind[],
  filters: MonitoredReleasesFilterState,
): MonitoredReleaseKind[] => {
  const {
    name,
    statuses,
    applications,
    releasePlans,
    namespaces,
    components,
    products,
    productVersions,
  } = filters;

  return monitoredReleases.filter((mr) => {
    const applicationName = mr?.metadata?.labels?.[PipelineRunLabel.APPLICATION];
    const releasePlanName = mr?.spec.releasePlan;
    const namespaceName = mr?.metadata?.namespace;
    const componentName = mr?.metadata?.labels?.[PipelineRunLabel.COMPONENT];
    const productName = mr?.product;
    const productVersionValue = mr?.productVersion;

    const applicationFilter =
      !applications.length ||
      applications.includes(applicationName) ||
      (applications.includes('No application') && applicationName === undefined);

    const componentFilter =
      !components.length ||
      components.includes(componentName) ||
      (components.includes('No component') && componentName === undefined);

    const productFilter =
      !products.length ||
      products.includes(productName) ||
      (products.includes('No product') && !productName);

    const productVersionFilter =
      !productVersions.length ||
      productVersions.includes(productVersionValue) ||
      (productVersions.includes('No product version') && !productVersionValue);

    return (
      (!name || mr?.metadata?.name?.indexOf(name) >= 0) &&
      (!statuses.length || statuses.includes(getReleaseStatus(mr))) &&
      applicationFilter &&
      (!releasePlans.length || releasePlans.includes(releasePlanName)) &&
      (!namespaces.length || namespaces.includes(namespaceName)) &&
      componentFilter &&
      productFilter &&
      productVersionFilter
    );
  });
};
