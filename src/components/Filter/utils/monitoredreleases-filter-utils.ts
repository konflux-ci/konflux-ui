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
  product: string[];
  productVersion: string[];
  showLatest: boolean;
};

export const filterMonitoredReleases = (
  monitoredReleases: MonitoredReleaseKind[],
  filters: MonitoredReleasesFilterState,
): MonitoredReleaseKind[] => {
  const { name, status, application, releasePlan, namespace, component, product, productVersion } =
    filters;

  return monitoredReleases.filter((mr) => {
    const applicationName = mr?.metadata?.labels?.[PipelineRunLabel.APPLICATION];
    const releasePlanName = mr?.spec.releasePlan;
    const namespaceName = mr?.metadata?.namespace;
    const componentName = mr?.metadata?.labels?.[PipelineRunLabel.COMPONENT];
    const productName = mr?.product;
    const productVersionValue = mr?.productVersion;

    const applicationFilter =
      !application.length ||
      application.includes(applicationName) ||
      (application.includes('No application') && applicationName === undefined);

    const componentFilter =
      !component.length ||
      component.includes(componentName) ||
      (component.includes('No component') && componentName === undefined);

    const productFilter =
      !product.length ||
      product.includes(productName) ||
      (product.includes('No product') && !productName);

    const productVersionFilter =
      !productVersion.length ||
      productVersion.includes(productVersionValue) ||
      (productVersion.includes('No product version') && !productVersionValue);

    return (
      (!name || mr?.metadata?.name?.indexOf(name) >= 0) &&
      (!status.length || status.includes(getReleaseStatus(mr))) &&
      applicationFilter &&
      (!releasePlan.length || releasePlan.includes(releasePlanName)) &&
      (!namespace.length || namespace.includes(namespaceName)) &&
      componentFilter &&
      productFilter &&
      productVersionFilter
    );
  });
};
