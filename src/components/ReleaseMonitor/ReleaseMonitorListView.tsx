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
import { getLastUsedNamespace } from '~/shared/providers/Namespace/utils';
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
import SelectNamespaceEmptyState from './SelectNamespaceEmptyState';

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.name]: 'metadata.name',
  [SortableHeaders.completionTime]: 'status.completionTime',
};

const NAMESPACE_THRESHOLD = 10;

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
  const [namespacesToFetch, setNamespacesToFetch] = React.useState<string[]>([]);

  const releasesRef = React.useRef<Record<string, MonitoredReleaseKind[]>>({});
  const loadedNamespacesRef = React.useRef<Set<string>>(new Set());

  const releasePlansRef = React.useRef<Record<string, ReleasePlanKind[]>>({});
  const loadedReleasePlansNamespacesRef = React.useRef<Set<string>>(new Set());

  const releasePlanAdmissionsRef = React.useRef<Record<string, ReleasePlanAdmissionKind[]>>({});
  const loadedRPAsNamespacesRef = React.useRef<Set<string>>(new Set());

  // Track target namespaces that need RPA fetching
  const [targetNamespaces, setTargetNamespaces] = React.useState<string[]>([]);
  const targetNamespacesCountRef = React.useRef<number>(0);

  // Track if namespace filter has been initialized
  const namespaceFilterInitializedRef = React.useRef<boolean>(false);

  // Function to enrich releases with product data
  const enrichAndSetReleases = React.useCallback(() => {
    const allReleasesLoaded = namespacesToFetch.every((ns) => loadedNamespacesRef.current.has(ns));
    const allReleasePlansLoaded = namespacesToFetch.every((ns) =>
      loadedReleasePlansNamespacesRef.current.has(ns),
    );

    // Calculate expected target namespaces from loaded ReleasePlans only
    const expectedTargetNamespaces = new Set<string>();
    namespacesToFetch.forEach((ns) => {
      const plans = releasePlansRef.current[ns] || [];
      plans.forEach((rp) => {
        if (rp.spec?.target) {
          expectedTargetNamespaces.add(rp.spec.target);
        }
      });
    });

    const allRPAsLoaded =
      expectedTargetNamespaces.size === 0 ||
      Array.from(expectedTargetNamespaces).every((ns) => loadedRPAsNamespacesRef.current.has(ns));

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
  }, [namespacesToFetch]);

  const handleReleasesLoaded = React.useCallback(
    (ns: string, data: MonitoredReleaseKind[]) => {
      releasesRef.current[ns] = data;
      loadedNamespacesRef.current.add(ns);
      // Safe to attempt; enrichAndSetReleases() is internally gated on "all loaded"
      enrichAndSetReleases();
    },
    [enrichAndSetReleases],
  );

  const handleError = React.useCallback((err: unknown) => {
    setError(err);
    setLoading(false);
  }, []);

  const handleReleasePlansLoaded = React.useCallback(
    (ns: string, data: ReleasePlanKind[]) => {
      releasePlansRef.current[ns] = data;
      loadedReleasePlansNamespacesRef.current.add(ns);

      // Determine target namespaces only from LOADED release plans
      const loadedReleasePlans = namespacesToFetch.flatMap(
        (nsName) => releasePlansRef.current[nsName] || [],
      );

      const rpaNamespaces = new Set<string>();
      loadedReleasePlans.forEach((rp) => {
        const target = rp.spec?.target;
        if (target) {
          rpaNamespaces.add(target);
        }
      });

      const targetArray = Array.from(rpaNamespaces);
      setTargetNamespaces(targetArray);
      targetNamespacesCountRef.current = targetArray.length;

      if (targetArray.length === 0) {
        enrichAndSetReleases();
      }
    },
    [namespacesToFetch, enrichAndSetReleases],
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

  // Initialize which namespaces to fetch based on threshold
  React.useEffect(() => {
    if (!loaded || namespaces.length === 0) return;

    if (namespaces.length <= NAMESPACE_THRESHOLD) {
      // Keep current behavior: fetch all namespaces
      setNamespacesToFetch(namespaces.map((n) => n.metadata.name));
      namespaceFilterInitializedRef.current = true;
    } else if (!namespaceFilterInitializedRef.current) {
      // Performance optimization: start with lastUsedNamespace
      const lastUsed = getLastUsedNamespace();
      const validLastUsed = namespaces.find((n) => n.metadata.name === lastUsed);

      // Use last used namespace, or fall back to first namespace
      const defaultNamespace = validLastUsed || namespaces[0];

      if (defaultNamespace) {
        namespaceFilterInitializedRef.current = true;
        setNamespacesToFetch([defaultNamespace.metadata.name]);
        // Auto-select the namespace in the filter to make it visible
        setFilters({
          ...unparsedFilters,
          namespace: [defaultNamespace.metadata.name],
        });
      } else {
        // No valid default: show empty state
        namespaceFilterInitializedRef.current = true;
        setNamespacesToFetch([]);
      }
    }
  }, [loaded, namespaces, setFilters, unparsedFilters]);

  // Watch filter changes and add newly selected namespaces to fetch list
  React.useEffect(() => {
    const selectedNamespaceFilters = namespace || [];

    if (namespaces.length > NAMESPACE_THRESHOLD && selectedNamespaceFilters.length > 0) {
      setNamespacesToFetch((prevFetched) => {
        const newNamespaces = selectedNamespaceFilters.filter((ns) => !prevFetched.includes(ns));
        return [...prevFetched, ...newNamespaces];
      });
    }
  }, [namespace, namespaces.length]);

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

    // For namespace options, ensure ALL namespaces are available, not just loaded ones
    const namespaceOptionsFromReleases = createFilterObj(
      releases,
      (mr) => mr?.metadata.namespace,
      nsKeys,
    );
    // Add all namespaces with 0 count if they're not in the releases
    const namespaceOptions = nsKeys.reduce(
      (acc, ns) => {
        if (acc[ns] === undefined) {
          acc[ns] = 0;
        }
        return acc;
      },
      { ...namespaceOptionsFromReleases },
    );

    return {
      statusOptions: createFilterObj(releases, (mr) => getReleaseStatus(mr), statuses),
      applicationOptions: applicationFilterOptions,
      releasePlanOptions: createFilterObj(releases, (mr) => mr?.spec.releasePlan),
      namespaceOptions,
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

  const pageDescription = React.useMemo(() => {
    const baseDescription = "The dashboard to monitor the releases you care about";
    if (loaded && namespaces.length > NAMESPACE_THRESHOLD && namespace.length > 0) {
      return `${baseDescription} (Viewing: ${namespace.join(', ')})`;
    }
    return baseDescription;
  }, [loaded, namespaces.length, namespace]);

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

  const shouldShowNamespaceSelector =
    loaded && namespaces.length > NAMESPACE_THRESHOLD && namespacesToFetch.length === 0;

  return (
    <PageLayout
      title="Release Monitor"
      description={pageDescription}
    >
      {/* Fetch Releases and ReleasePlans from origin namespaces */}
      {loaded &&
        namespacesToFetch.map((nsName) => (
          <React.Fragment key={`origin-${nsName}`}>
            <ReleasesInNamespace
              namespace={nsName}
              onReleasesLoaded={handleReleasesLoaded}
              onError={handleError}
            />
            <ReleasePlansInNamespace
              namespace={nsName}
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
      {(isFiltered ||
        releases.length > 0 ||
        namespacesToFetch.length > 0 ||
        (loaded && namespaces.length > NAMESPACE_THRESHOLD)) && (
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
        NoDataEmptyMsg={
          shouldShowNamespaceSelector ? SelectNamespaceEmptyState : MonitoredReleaseEmptyState
        }
        aria-label="Release List"
        Header={ReleasesListHeader}
        Row={ReleaseListRow}
        loaded={!loading || releases.length > 0}
      />
    </PageLayout>
  );
};

export default ReleaseMonitorListView;
