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
import { statuses } from '~/utils/commits-utils';
import MonitoredReleaseEmptyState from './ReleaseEmptyState';
import { getReleasesListHeader, SortableHeaders } from './ReleaseListHeader';
import ReleaseListRow from './ReleaseListRow';
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

  const { name, status, application, releasePlan, namespace, component } = filters;

  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();

  const [releases, setReleases] = React.useState<MonitoredReleaseKind[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>();

  const releasesRef = React.useRef<Record<string, MonitoredReleaseKind[]>>({});
  const loadedNamespacesRef = React.useRef<Set<string>>(new Set());

  const handleReleasesLoaded = React.useCallback(
    (ns: string, data: MonitoredReleaseKind[]) => {
      releasesRef.current[ns] = data;
      loadedNamespacesRef.current.add(ns);

      if (loadedNamespacesRef.current.size === namespaces.length) {
        const allReleases = Object.values(releasesRef.current).flat();
        setReleases(allReleases);
        setLoading(false);
        setError(null);
      }
    },
    [namespaces.length],
  );

  const handleError = React.useCallback((err: unknown) => {
    setError(err);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (loaded && namespaces.length > 0) {
      setLoading(true);
      releasesRef.current = {};
      loadedNamespacesRef.current = new Set();
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

    return {
      statusOptions: createFilterObj(releases, (mr) => getReleaseStatus(mr), statuses),
      applicationOptions: applicationFilterOptions,
      releasePlanOptions: createFilterObj(releases, (mr) => mr?.spec.releasePlan),
      namespaceOptions: createFilterObj(releases, (mr) => mr?.metadata.namespace, nsKeys),
      componentOptions: componentFilterOptions,
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
    filters.showLatest;

  return (
    <PageLayout
      title="Release Monitor"
      description="The dashboard to monitor the releases you care about"
    >
      {loaded &&
        namespaces.map((ns) => (
          <ReleasesInNamespace
            key={ns.metadata.name}
            namespace={ns.metadata.name}
            onReleasesLoaded={handleReleasesLoaded}
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
