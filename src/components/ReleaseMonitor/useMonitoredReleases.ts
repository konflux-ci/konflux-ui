import * as React from 'react';
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { getResourceId } from '~/hooks/useK8sAndKarchResources';
import { createListqueryOptions, K8sResourceListOptions } from '~/k8s';
import { useIsKubeArchiveEnabled } from '~/kubearchive/conditional-checks';
import { KUBEARCHIVE_RESOURCE_LIMIT } from '~/kubearchive/const';
import { withKubearchivePathPrefix } from '~/kubearchive/fetch-utils';
import { ReleaseModel, ReleasePlanModel } from '~/models';
import { ReleasePlanAdmissionModel } from '~/models/release-plan-admission';
import { MonitoredReleaseKind } from '~/types';
import { ReleasePlanKind, ReleasePlanLabel } from '~/types/coreBuildService';
import { K8sModelCommon, K8sResourceCommon } from '~/types/k8s';
import { ReleasePlanAdmissionKind } from '~/types/release-plan-admission';
import { filterOutDeletedAndStaleRunningResources } from '~/utils/resource-utils';

type NamespacedListResult<T> = {
  /** Resources of every requested namespace, index aligned with the namespace list. */
  data: T[][];
  /** Error of every requested namespace, index aligned with the namespace list. */
  errors: unknown[];
  isLoading: boolean;
};

/**
 * Declared at module scope so `useQueries` can memoize the combined result; an inline
 * function would be a new reference on every render and defeat that memoization.
 */
const combineListResults = <T>(results: UseQueryResult<T[]>[]): NamespacedListResult<T> => ({
  data: results.map((result) => result.data ?? []),
  errors: results.map((result) => result.error),
  isLoading: results.some((result) => result.isLoading),
});

const isPermissionError = (error: unknown): boolean =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  (error.code === 403 || error.code === 401);

/**
 * Lists a single resource kind across many namespaces in one hook call, so the number of
 * namespaces can change between renders without breaking the rules of hooks.
 */
const useListQueriesInNamespaces = <T extends K8sResourceCommon>(
  namespaces: string[],
  model: K8sModelCommon,
  { fromArchive = false, enabled = true }: { fromArchive?: boolean; enabled?: boolean } = {},
): NamespacedListResult<T> =>
  useQueries({
    queries: namespaces.map((ns) =>
      fromArchive
        ? createListqueryOptions<T[]>(
            withKubearchivePathPrefix<K8sResourceListOptions>({
              model,
              queryOptions: { ns, queryParams: { limit: KUBEARCHIVE_RESOURCE_LIMIT } },
            }),
            {
              enabled,
              filterData: (resources) => filterOutDeletedAndStaleRunningResources(resources, model),
            },
          )
        : createListqueryOptions<T[]>({ model, queryOptions: { ns } }, { enabled }),
    ),
    combine: combineListResults<T>,
  });

export type MonitoredReleasesResult = {
  releases: MonitoredReleaseKind[];
  isLoading: boolean;
  error: unknown;
};

const EMPTY_RELEASES: MonitoredReleaseKind[] = [];

/**
 * Fetches the Releases of the given namespaces, both from the cluster and from KubeArchive,
 * and enriches them with the product data of the ReleasePlanAdmission their ReleasePlan
 * points at. ReleasePlanAdmissions live in the target namespaces of the ReleasePlans, so
 * they can only be fetched once the ReleasePlans have resolved.
 */
export const useMonitoredReleases = (namespaces: string[]): MonitoredReleasesResult => {
  const { isKubearchiveEnabled } = useIsKubeArchiveEnabled();

  const clusterReleases = useListQueriesInNamespaces<MonitoredReleaseKind>(
    namespaces,
    ReleaseModel,
  );
  const archivedReleases = useListQueriesInNamespaces<MonitoredReleaseKind>(
    namespaces,
    ReleaseModel,
    { fromArchive: true, enabled: isKubearchiveEnabled },
  );
  const releasePlans = useListQueriesInNamespaces<ReleasePlanKind>(namespaces, ReleasePlanModel);

  const targetNamespaces = React.useMemo(
    () =>
      Array.from(
        new Set(
          releasePlans.data
            .flat()
            .map((releasePlan) => releasePlan.spec?.target)
            .filter(Boolean),
        ),
      ).sort(),
    [releasePlans.data],
  );

  const releasePlanAdmissions = useListQueriesInNamespaces<ReleasePlanAdmissionKind>(
    targetNamespaces,
    ReleasePlanAdmissionModel,
  );

  const isLoading =
    clusterReleases.isLoading ||
    archivedReleases.isLoading ||
    releasePlans.isLoading ||
    releasePlanAdmissions.isLoading;

  const error = React.useMemo(() => {
    // Releases are served by two sources, so a namespace only fails when both of them fail.
    const failedReleasesIndex = clusterReleases.errors.findIndex(
      (clusterError, index) => !!clusterError && !!archivedReleases.errors[index],
    );
    if (failedReleasesIndex !== -1) {
      return archivedReleases.errors[failedReleasesIndex];
    }
    const releasePlansError = releasePlans.errors.find(Boolean);
    if (releasePlansError) {
      return releasePlansError;
    }
    // Target namespaces the user cannot read are reported as empty instead of failing the page.
    return releasePlanAdmissions.errors.find(
      (admissionError) => !!admissionError && !isPermissionError(admissionError),
    );
  }, [
    clusterReleases.errors,
    archivedReleases.errors,
    releasePlans.errors,
    releasePlanAdmissions.errors,
  ]);

  const enrichedReleases = React.useMemo(() => {
    const releasePlansByKey = new Map(
      releasePlans.data
        .flat()
        .map((releasePlan) => [
          `${releasePlan.metadata.namespace}:${releasePlan.metadata.name}`,
          releasePlan,
        ]),
    );
    const admissionsByKey = new Map(
      releasePlanAdmissions.data
        .flat()
        .map((admission) => [
          `${admission.metadata.namespace}:${admission.metadata.name}`,
          admission,
        ]),
    );

    const seenReleaseIds = new Set<string>();
    // Cluster results come first so they win over the archived copy of the same Release.
    return [...clusterReleases.data.flat(), ...archivedReleases.data.flat()].reduce<
      MonitoredReleaseKind[]
    >((acc, release) => {
      const releaseId = getResourceId(release);
      if (seenReleaseIds.has(releaseId)) {
        return acc;
      }
      seenReleaseIds.add(releaseId);

      const releasePlan = releasePlansByKey.get(
        `${release.metadata.namespace}:${release.spec.releasePlan}`,
      );
      const rpaName = releasePlan?.metadata.labels?.[ReleasePlanLabel.RELEASE_PLAN_ADMISSION] || '';
      const rpa = rpaName
        ? admissionsByKey.get(`${releasePlan?.spec?.target}:${rpaName}`)
        : undefined;

      acc.push({
        ...release,
        product: rpa?.spec?.data?.releaseNotes?.product_name || undefined,
        productVersion: rpa?.spec?.data?.releaseNotes?.product_version || undefined,
        rpa: rpaName,
      });
      return acc;
    }, []);
  }, [clusterReleases.data, archivedReleases.data, releasePlans.data, releasePlanAdmissions.data]);

  // Releases resolve before the ReleasePlanAdmissions they are enriched with, so the last
  // settled list is kept until everything has loaded to avoid rendering rows whose product
  // columns are still empty.
  const settledReleasesRef = React.useRef(EMPTY_RELEASES);
  if (!isLoading) {
    settledReleasesRef.current = enrichedReleases;
  }
  const releases = isLoading ? settledReleasesRef.current : enrichedReleases;

  return React.useMemo(() => ({ releases, isLoading, error }), [releases, isLoading, error]);
};
