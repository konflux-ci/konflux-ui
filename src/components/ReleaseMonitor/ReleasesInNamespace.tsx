import * as React from 'react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { useK8sWatchResource } from '~/k8s';
import {
  ReleaseGroupVersionKind,
  ReleaseModel,
  ReleasePlanAdmissionGroupVersionKind,
  ReleasePlanAdmissionModel,
  ReleasePlanGroupVersionKind,
  ReleasePlanModel,
} from '~/models';
import {
  MonitoredReleaseKind,
  ReleaseKind,
  ReleasePlanAdmissionKind,
  ReleasePlanKind,
} from '~/types';
import { ReleasePlanLabel } from '../../types/coreBuildService';
import { MultipleNamespaceAdmissionsWatcher } from './MultipleNamespaceAdmissionsWatcher';

type ReleasesInNamespaceProps = {
  namespace: string;
  onReleasesLoaded: (releases: MonitoredReleaseKind[]) => void;
  onError: (error: unknown) => void;
};

// Type-safe enhancement function
const enhanceReleaseToMonitored = (
  release: ReleaseKind,
  releasePlans: ReleasePlanKind[],
  allReleasePlanAdmissions: ReleasePlanAdmissionKind[],
): MonitoredReleaseKind => {
  let product = '';
  let productVersion = '';
  let rpa = '';

  const releasePlan = releasePlans.find((rp) => rp.metadata.name === release.spec.releasePlan);

  if (releasePlan) {
    const rpaName = releasePlan?.metadata?.labels?.[ReleasePlanLabel.RELEASE_PLAN_ADMISSION];
    rpa = rpaName || '';

    if (rpaName) {
      const rpaObj = allReleasePlanAdmissions.find((a) => a.metadata.name === rpaName);
      if (rpaObj) {
        product = rpaObj.spec.data?.releaseNotes?.product_name;
        productVersion = rpaObj.spec.data?.releaseNotes?.product_version;
      }
    }
  }

  return {
    ...release,
    product,
    productVersion,
    rpa,
  };
};

const ReleasesInNamespace: React.FC<ReleasesInNamespaceProps> = ({
  namespace,
  onReleasesLoaded,
  onError,
}) => {
  const {
    data: releases,
    isLoading: releasesLoading,
    clusterError: releasesClusterError,
    archiveError: releasesArchiveError,
  } = useK8sAndKarchResources<ReleaseKind>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
    },
    ReleaseModel,
  );

  const {
    data: releasePlans,
    isLoading: releasePlansLoading,
    error: releasePlansError,
  } = useK8sWatchResource<ReleasePlanKind[]>(
    {
      groupVersionKind: ReleasePlanGroupVersionKind,
      namespace,
      isList: true,
    },
    ReleasePlanModel,
  );

  const {
    data: releasePlanAdmissions,
    isLoading: releasePlanAdmissionsLoading,
    error: releasePlanAdmissionsError,
  } = useK8sWatchResource<ReleasePlanAdmissionKind[]>(
    {
      groupVersionKind: ReleasePlanAdmissionGroupVersionKind,
      namespace,
      isList: true,
    },
    ReleasePlanAdmissionModel,
  );

  const managedNamespaces = React.useMemo(() => {
    if (!releasePlans) return [];

    const namespaceSet = new Set<string>();
    releasePlans.forEach((releasePlan) => {
      const targetNamespace = releasePlan.spec?.target;
      const currentNamespace = releasePlan.metadata?.namespace;

      if (targetNamespace) {
        namespaceSet.add(targetNamespace);
      } else if (currentNamespace) {
        namespaceSet.add(currentNamespace);
      }
    });

    return Array.from(namespaceSet);
  }, [releasePlans]);

  const [
    { data: allReleasePlanAdmissions, isLoading: allAdmissionsLoading, error: allAdmissionsError },
    setAllAdmissions,
  ] = React.useState<{
    data: ReleasePlanAdmissionKind[];
    isLoading: boolean;
    error: unknown;
  }>({
    data: [],
    isLoading: true,
    error: undefined,
  });

  const handleAdmissionsUpdate = React.useCallback(
    (data: ReleasePlanAdmissionKind[], isLoading: boolean, error: unknown) => {
      setAllAdmissions({ data, isLoading, error });
    },
    [],
  );

  React.useEffect(() => {
    const error =
      (releasesClusterError && releasesArchiveError) ||
      releasePlansError ||
      releasePlanAdmissionsError ||
      allAdmissionsError;

    if (error) {
      onError(error);
      return;
    }

    const allDataLoaded =
      !releasesLoading &&
      !releasePlansLoading &&
      !releasePlanAdmissionsLoading &&
      !allAdmissionsLoading &&
      releases &&
      releasePlans &&
      releasePlanAdmissions;

    if (allDataLoaded) {
      // ✅ Create new array using immutable approach
      const monitoredReleases: MonitoredReleaseKind[] = releases.map((release) =>
        enhanceReleaseToMonitored(release, releasePlans, allReleasePlanAdmissions),
      );

      onReleasesLoaded(monitoredReleases);
    }
  }, [
    releases,
    releasesLoading,
    releasesClusterError,
    releasesArchiveError,
    releasePlans,
    releasePlansLoading,
    releasePlansError,
    releasePlanAdmissions,
    releasePlanAdmissionsLoading,
    releasePlanAdmissionsError,
    allAdmissionsLoading,
    allAdmissionsError,
    allReleasePlanAdmissions,
    onReleasesLoaded,
    onError,
    namespace,
  ]);

  return (
    <MultipleNamespaceAdmissionsWatcher
      namespaces={managedNamespaces}
      onUpdate={handleAdmissionsUpdate}
    />
  );
};

export default ReleasesInNamespace;
