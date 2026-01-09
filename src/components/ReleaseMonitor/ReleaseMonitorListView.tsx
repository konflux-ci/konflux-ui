import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MENU_DIVIDER } from '~/components/Filter/generic/MultiSelect.tsx';
import MonitoredReleasesFilterToolbar from '~/components/Filter/toolbars/MonitoredReleasesFilterToolbar';
import { createFilterObj, FilterType } from '~/components/Filter/utils/filter-utils';
import {
  filterMonitoredReleases,
  MonitoredReleasesFilterState,
} from '~/components/Filter/utils/monitoredreleases-filter-utils';
import PageLayout from '~/components/PageLayout/PageLayout';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { getReleaseStatus } from '~/hooks/useReleaseStatus';
import { useSortedResources } from '~/hooks/useSortedResources';
import { Table } from '~/shared';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespaceInfo } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { MonitoredReleaseKind } from '~/types';
import { ReleasePlanKind, ReleasePlanLabel } from '~/types/coreBuildService';
import { ReleasePlanAdmissionKind } from '~/types/release-plan-admission';
import { statuses } from '~/utils/commits-utils';
import MonitoredReleaseEmptyState from './ReleaseEmptyState';
import { getReleasesListHeader, SortableHeaders } from './ReleaseListHeader';
import ReleaseListRow from './ReleaseListRow';
import ReleasePlanAdmissionsInNamespace from './ReleasePlanAdmissionsInNamespace';
import ReleasePlansInNamespace from './ReleasePlansInNamespace';
import ReleasesInNamespace from './ReleasesInNamespace';

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.name]: 'metadata.name',
  [SortableHeaders.completionTime]: 'status.completionTime',
};

const ReleaseMonitorListView: React.FunctionComponent = () => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);

  const parseMonitoredFilters = (filters: FilterType): MonitoredReleasesFilterState => {
    return {
      name: filters?.name || '',
      status: filters?.status || [],
      application: filters?.application || [],
      releasePlan: filters?.releasePlan || [],
      namespace: filters?.namespace || [],
      component: filters?.component || [],
      product: filters?.product || [],
      productVersion: filters?.productVersion || [],
      showLatest: filters?.showLatest || false,
    } as MonitoredReleasesFilterState;
  };

  const filters: MonitoredReleasesFilterState = parseMonitoredFilters(unparsedFilters);

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    SortableHeaders.completionTime,
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.desc,
  );

  const { name, status, application, releasePlan, namespace, component, product, productVersion } =
    filters;

  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();

  const [releases, setReleases] = React.useState<MonitoredReleaseKind[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>();

  const releasesRef = React.useRef<Record<string, MonitoredReleaseKind[]>>({});
  const loadedNamespacesRef = React.useRef<Set<string>>(new Set());

  const releasePlansRef = React.useRef<Record<string, ReleasePlanKind[]>>({});
  const loadedReleasePlansNamespacesRef = React.useRef<Set<string>>(new Set());

  const releasePlanAdmissionsRef = React.useRef<Record<string, ReleasePlanAdmissionKind[]>>({});
  const loadedRPAsNamespacesRef = React.useRef<Set<string>>(new Set());

  // Track target namespaces that need RPA fetching
  const [targetNamespaces, setTargetNamespaces] = React.useState<string[]>([]);
  const targetNamespacesCountRef = React.useRef<number>(0);

  // Function to enrich releases with product data
  const enrichAndSetReleases = React.useCallback(() => {
    const allReleasesLoaded = loadedNamespacesRef.current.size === namespaces.length;
    const allReleasePlansLoaded =
      loadedReleasePlansNamespacesRef.current.size === namespaces.length;
    const allRPAsLoaded =
      targetNamespacesCountRef.current === 0 ||
      loadedRPAsNamespacesRef.current.size === targetNamespacesCountRef.current;

    if (allReleasesLoaded && allReleasePlansLoaded && allRPAsLoaded) {
      const allReleases = Object.values(releasesRef.current).flat();
      const allReleasePlans = Object.values(releasePlansRef.current).flat();
      const allRPAs = Object.values(releasePlanAdmissionsRef.current).flat();

      // Build lookup maps for O(1) access instead of O(n) find operations
      const releasePlansByKey = allReleasePlans.reduce(
        (acc, rp) => {
          const key = `${rp.metadata.namespace}:${rp.metadata.name}`;
          acc[key] = rp;
          return acc;
        },
        {} as Record<string, ReleasePlanKind>,
      );

      const rpasByKey = allRPAs.reduce(
        (acc, rpa) => {
          const key = `${rpa.metadata.namespace}:${rpa.metadata.name}`;
          acc[key] = rpa;
          return acc;
        },
        {} as Record<string, ReleasePlanAdmissionKind>,
      );

      // Enrich releases with product data using O(1) lookups
      const enrichedReleases = allReleases.map((release) => {
        const releasePlanKey = `${release.metadata.namespace}:${release.spec.releasePlan}`;
        const foundReleasePlan = releasePlansByKey[releasePlanKey];

        if (!foundReleasePlan) {
          return { ...release, rpa: '' } as MonitoredReleaseKind;
        }

        const rpaName =
          foundReleasePlan.metadata.labels?.[ReleasePlanLabel.RELEASE_PLAN_ADMISSION] || '';

        if (!rpaName) {
          return { ...release, rpa: '' } as MonitoredReleaseKind;
        }

        const rpaKey = `${foundReleasePlan.spec?.target}:${rpaName}`;
        const rpa = rpasByKey[rpaKey];

        return {
          ...release,
          product: rpa?.spec?.data?.releaseNotes?.product_name || undefined,
          productVersion: rpa?.spec?.data?.releaseNotes?.product_version || undefined,
          rpa: rpaName,
        } as MonitoredReleaseKind;
      });

      setReleases(enrichedReleases);
      setLoading(false);
      setError(null);
    }
  }, [namespaces.length]);

  const handleReleasesLoaded = React.useCallback((ns: string, data: MonitoredReleaseKind[]) => {
    releasesRef.current[ns] = data;
    loadedNamespacesRef.current.add(ns);
    // Don't try to enrich here - wait for ReleasePlans to determine target namespaces first
  }, []);

  const handleError = React.useCallback((err: unknown) => {
    setError(err);
    setLoading(false);
  }, []);

  const handleReleasePlansLoaded = React.useCallback(
    (ns: string, data: ReleasePlanKind[]) => {
      releasePlansRef.current[ns] = data;
      loadedReleasePlansNamespacesRef.current.add(ns);

      // Once all ReleasePlans are loaded, determine target namespaces for RPA fetching
      if (loadedReleasePlansNamespacesRef.current.size === namespaces.length) {
        const allReleasePlans = Object.values(releasePlansRef.current).flat();

        const rpaNamespaces = new Set<string>();

        // Add target namespaces from ReleasePlans
        allReleasePlans.forEach((rp) => {
          const target = rp.spec?.target;
          if (target) {
            rpaNamespaces.add(target);
          }
        });

        const targetArray = Array.from(rpaNamespaces);
        setTargetNamespaces(targetArray);
        targetNamespacesCountRef.current = targetArray.length;

        // If there are no target namespaces (no RPAs needed), enrich immediately
        if (targetArray.length === 0) {
          enrichAndSetReleases();
        }
      }
    },
    [namespaces, enrichAndSetReleases],
  );

  const handleReleasePlanAdmissionsLoaded = React.useCallback(
    (ns: string, data: ReleasePlanAdmissionKind[]) => {
      releasePlanAdmissionsRef.current[ns] = data;
      loadedRPAsNamespacesRef.current.add(ns);
      // Try to enrich if all data is ready
      enrichAndSetReleases();
    },
    [enrichAndSetReleases],
  );

  React.useEffect(() => {
    if (loaded && namespaces.length > 0) {
      setLoading(true);
      releasesRef.current = {};
      loadedNamespacesRef.current = new Set();
      releasePlansRef.current = {};
      loadedReleasePlansNamespacesRef.current = new Set();
      releasePlanAdmissionsRef.current = {};
      loadedRPAsNamespacesRef.current = new Set();
      setTargetNamespaces([]);
      targetNamespacesCountRef.current = 0;
    } else if (loaded) {
      setLoading(false);
    }
  }, [loaded, namespaces]);

  const filterOptions = React.useMemo(() => {
    if (releases.length === 0 && namespaces.length === 0) {
      return {
        statusOptions: {},
        applicationOptions: {},
        releasePlanOptions: {},
        namespaceOptions: {},
        componentOptions: {},
        productOptions: {},
        productVersionOptions: {},
      };
    }
    const nsKeys = namespaces.map((ns) => ns.metadata.name);
    const applicationOptions = createFilterObj(
      releases,
      (mr) => mr?.metadata.labels[PipelineRunLabel.APPLICATION],
    );
    const noApplication = applicationOptions.undefined;
    delete applicationOptions.undefined;

    const applicationFilterOptions =
      noApplication > 0
        ? {
            'No application': noApplication,
            [MENU_DIVIDER]: 1,
            ...applicationOptions,
          }
        : applicationOptions;

    const componentOptions = createFilterObj(
      releases,
      (mr) => mr?.metadata.labels[PipelineRunLabel.COMPONENT],
    );
    const noComponent = componentOptions.undefined;
    delete componentOptions.undefined;

    const componentFilterOptions =
      noComponent > 0
        ? {
            'No component': noComponent,
            [MENU_DIVIDER]: 1,
            ...componentOptions,
          }
        : componentOptions;

    const productOptions = createFilterObj(releases, (mr) => mr?.product);
    const noProduct = productOptions.undefined;
    delete productOptions.undefined;

    const productFilterOptions =
      noProduct > 0
        ? {
            'No product': noProduct,
            [MENU_DIVIDER]: 1,
            ...productOptions,
          }
        : productOptions;

    const productVersionOptions = createFilterObj(releases, (mr) => mr?.productVersion);
    const noProductVersion = productVersionOptions.undefined;
    delete productVersionOptions.undefined;

    const productVersionFilterOptions =
      noProductVersion > 0
        ? {
            'No product version': noProductVersion,
            [MENU_DIVIDER]: 1,
            ...productVersionOptions,
          }
        : productVersionOptions;

    return {
      statusOptions: createFilterObj(releases, (mr) => getReleaseStatus(mr), statuses),
      applicationOptions: applicationFilterOptions,
      releasePlanOptions: createFilterObj(releases, (mr) => mr?.spec.releasePlan),
      namespaceOptions: createFilterObj(releases, (mr) => mr?.metadata.namespace, nsKeys),
      componentOptions: componentFilterOptions,
      productOptions: productFilterOptions,
      productVersionOptions: productVersionFilterOptions,
    };
  }, [releases, namespaces]);

  const filteredData = React.useMemo(() => {
    let filtered = filterMonitoredReleases(releases, filters);

    if (filters.showLatest) {
      const { latestReleasesByComponent, releasesWithoutComponent } = filtered.reduce(
        (acc, release) => {
          const componentName = release.metadata?.labels?.[PipelineRunLabel.COMPONENT];

          if (componentName) {
            const existing = acc.latestReleasesByComponent[componentName];
            if (
              !existing ||
              new Date(existing.metadata.creationTimestamp) <
                new Date(release.metadata.creationTimestamp)
            ) {
              acc.latestReleasesByComponent[componentName] = release;
            }
          } else {
            acc.releasesWithoutComponent.push(release);
          }

          return acc;
        },
        {
          latestReleasesByComponent: {} as Record<string, MonitoredReleaseKind>,
          releasesWithoutComponent: [] as MonitoredReleaseKind[],
        },
      );

      // Use map to merge latest component releases and untagged ones
      filtered = [
        ...Object.values(latestReleasesByComponent),
        ...releasesWithoutComponent.map((r) => r),
      ];
    }

    return filtered;
  }, [releases, filters]);

  const sortedFilteredData = useSortedResources(
    filteredData,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  const ReleasesListHeader = React.useMemo(
    () =>
      getReleasesListHeader(
        activeSortIndex,
        activeSortDirection,
        (_event: React.MouseEvent, index: number, direction: SortByDirection) => {
          setActiveSortIndex(index);
          setActiveSortDirection(direction);
        },
        sortedFilteredData.length,
      ),
    [activeSortDirection, activeSortIndex, sortedFilteredData.length],
  );

  const EmptyMsg = React.useCallback(
    () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />,
    [onClearFilters],
  );

  if (error) {
    return getErrorState(error, loaded, 'applications');
  }

  const isFiltered =
    name.length > 0 ||
    status.length > 0 ||
    application.length > 0 ||
    releasePlan.length > 0 ||
    namespace.length > 0 ||
    component.length > 0 ||
    product.length > 0 ||
    productVersion.length > 0 ||
    filters.showLatest;

  return (
    <PageLayout
      title="Release Monitor"
      description="The dashboard to monitor the releases you care about"
    >
      {/* Fetch Releases and ReleasePlans from origin namespaces */}
      {loaded &&
        namespaces.map((ns) => (
          <React.Fragment key={`origin-${ns.metadata.name}`}>
            <ReleasesInNamespace
              namespace={ns.metadata.name}
              onReleasesLoaded={handleReleasesLoaded}
              onError={handleError}
            />
            <ReleasePlansInNamespace
              namespace={ns.metadata.name}
              onReleasePlansLoaded={handleReleasePlansLoaded}
              onError={handleError}
            />
          </React.Fragment>
        ))}
      {/* Fetch ReleasePlanAdmissions from target namespaces only */}
      {targetNamespaces.map((targetNs) => (
        <ReleasePlanAdmissionsInNamespace
          key={`rpa-${targetNs}`}
          namespace={targetNs}
          onReleasePlanAdmissionsLoaded={handleReleasePlanAdmissionsLoaded}
          onError={handleError}
        />
      ))}
      {(isFiltered || releases.length > 0) && (
        <MonitoredReleasesFilterToolbar
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          statusOptions={filterOptions.statusOptions}
          applicationOptions={filterOptions.applicationOptions}
          releasePlanOptions={filterOptions.releasePlanOptions}
          namespaceOptions={filterOptions.namespaceOptions}
          componentOptions={filterOptions.componentOptions}
          productOptions={filterOptions.productOptions}
          productVersionOptions={filterOptions.productVersionOptions}
        />
      )}

      <Table
        virtualize
        data={sortedFilteredData}
        unfilteredData={sortedFilteredData}
        EmptyMsg={EmptyMsg}
        NoDataEmptyMsg={MonitoredReleaseEmptyState}
        aria-label="Release List"
        Header={ReleasesListHeader}
        Row={ReleaseListRow}
        loaded={!loading || releases.length > 0}
      />
    </PageLayout>
  );
};

export default ReleaseMonitorListView;
