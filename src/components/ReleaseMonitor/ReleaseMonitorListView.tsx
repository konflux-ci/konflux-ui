import * as React from 'react';
import { Flex, FlexItem, Label, PageSection, pluralize } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MENU_DIVIDER } from '~/components/Filter/generic/MultiSelect';
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
import { statuses as statusList } from '~/utils/commits-utils';
import MonitoredReleaseEmptyState from './ReleaseEmptyState';
import { getReleasesListHeader, SortableHeaders } from './ReleaseListHeader';
import ReleaseListRow from './ReleaseListRow';
import SelectNamespaceEmptyState from './SelectNamespaceEmptyState';
import { useMonitoredReleases } from './useMonitoredReleases';
import { useNamespacesToFetch } from './useNamespacesToFetch';

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
      statuses: filters?.status || [],
      applications: filters?.application || [],
      releasePlans: filters?.releasePlan || [],
      namespaces: filters?.namespace || [],
      components: filters?.component || [],
      products: filters?.product || [],
      productVersions: filters?.productVersion || [],
      showLatest: filters?.showLatest || false,
    } as MonitoredReleasesFilterState;
  };

  const unparseMonitoredFilters = (filters: MonitoredReleasesFilterState): FilterType => {
    return {
      name: filters?.name || '',
      status: filters?.statuses || [],
      application: filters?.applications || [],
      releasePlan: filters?.releasePlans || [],
      namespace: filters?.namespaces || [],
      component: filters?.components || [],
      product: filters?.products || [],
      productVersion: filters?.productVersions || [],
      showLatest: filters?.showLatest || false,
    } as FilterType;
  };

  const filters: MonitoredReleasesFilterState = parseMonitoredFilters(unparsedFilters);

  const handleSetFilters = (newFilters: MonitoredReleasesFilterState) => {
    setFilters(unparseMonitoredFilters(newFilters));
  };

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    SortableHeaders.completionTime,
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.desc,
  );

  const {
    name,
    statuses,
    applications,
    releasePlans,
    namespaces: selectedNamespaces,
    components,
    products,
    productVersions,
  } = filters;

  const { namespaces, namespacesLoaded: loaded, lastUsedNamespace } = useNamespaceInfo();

  // Manage which namespaces to fetch based on threshold and filters
  const { namespacesToFetch } = useNamespacesToFetch({
    loaded,
    namespaces,
    unparsedFilters,
    lastUsedNamespace,
    setFilters,
    selectedNamespaces,
    threshold: NAMESPACE_THRESHOLD,
  });

  const {
    releases,
    isLoading: monitoredReleasesLoading,
    error: monitoredReleasesError,
  } = useMonitoredReleases(namespacesToFetch);

  // `useNamespacesToFetch` resolves its namespaces in an effect, so the render in between
  // has nothing to fetch yet and must still count as loading.
  const loading =
    !loaded ||
    (namespaces.length > 0 && namespacesToFetch.length === 0) ||
    monitoredReleasesLoading;

  const filterOptions = React.useMemo(() => {
    if (releases.length === 0 && namespaces.length === 0) {
      return {
        statusOptions: [],
        applicationOptions: [],
        releasePlanOptions: [],
        namespaceOptions: [],
        componentOptions: [],
        productOptions: [],
        productVersionOptions: [],
      };
    }
    const nsKeys = namespaces.map((ns) => ns.metadata.name);

    // When namespace count exceeds threshold and no namespaces are selected,
    // the table shows an empty state — filter options should also be empty
    // to avoid displaying stale counts alongside an empty table.
    const shouldShowEmptyOptions =
      namespaces.length > NAMESPACE_THRESHOLD &&
      selectedNamespaces.length === 0 &&
      releases.length > 0;

    // Filter releases to only include those from selected namespaces
    const releasesFromSelectedNamespaces = shouldShowEmptyOptions
      ? []
      : selectedNamespaces.length > 0
        ? releases.filter((mr) => selectedNamespaces.includes(mr.metadata.namespace))
        : releases;

    const buildOptionsWithNoValue = (
      options: { key: string; count?: number; label?: string }[],
      noValueLabel: string,
      missingCount: number,
    ) => {
      const filteredOptions = options.filter((option) => option.key !== 'undefined');
      if (missingCount > 0) {
        return [
          { key: noValueLabel, count: missingCount },
          { key: MENU_DIVIDER },
          ...filteredOptions,
        ];
      }
      return filteredOptions;
    };

    const applicationOptions = createFilterObj(
      releasesFromSelectedNamespaces,
      (mr) => mr?.metadata.labels[PipelineRunLabel.APPLICATION] ?? 'undefined',
      undefined,
      undefined,
      true,
    );
    const noApplication =
      applicationOptions.find((option) => option.key === 'undefined')?.count ?? 0;
    const applicationFilterOptions = buildOptionsWithNoValue(
      applicationOptions,
      'No application',
      noApplication,
    );

    const componentOptions = createFilterObj(
      releasesFromSelectedNamespaces,
      (mr) => mr?.metadata.labels[PipelineRunLabel.COMPONENT] ?? 'undefined',
      undefined,
      undefined,
      true,
    );
    const noComponent = componentOptions.find((option) => option.key === 'undefined')?.count ?? 0;
    const componentFilterOptions = buildOptionsWithNoValue(
      componentOptions,
      'No component',
      noComponent,
    );

    const productOptions = createFilterObj(
      releasesFromSelectedNamespaces,
      (mr) => mr?.product ?? 'undefined',
      undefined,
      undefined,
      true,
    );
    const noProduct = productOptions.find((option) => option.key === 'undefined')?.count ?? 0;
    const productFilterOptions = buildOptionsWithNoValue(productOptions, 'No product', noProduct);

    const productVersionOptions = createFilterObj(
      releasesFromSelectedNamespaces,
      (mr) => mr?.productVersion ?? 'undefined',
      undefined,
      undefined,
      true,
    );
    const noProductVersion =
      productVersionOptions.find((option) => option.key === 'undefined')?.count ?? 0;
    const productVersionFilterOptions = buildOptionsWithNoValue(
      productVersionOptions,
      'No product version',
      noProductVersion,
    );

    return {
      statusOptions: createFilterObj(
        releasesFromSelectedNamespaces,
        (mr) => getReleaseStatus(mr),
        statusList,
      ),
      applicationOptions: applicationFilterOptions,
      releasePlanOptions: createFilterObj(
        releasesFromSelectedNamespaces,
        (mr) => mr?.spec.releasePlan,
      ),
      namespaceOptions: createFilterObj(releases, (mr) => mr?.metadata.namespace, nsKeys),
      componentOptions: componentFilterOptions,
      productOptions: productFilterOptions,
      productVersionOptions: productVersionFilterOptions,
    };
  }, [releases, namespaces, selectedNamespaces]);

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
      ),
    [activeSortDirection, activeSortIndex],
  );

  const EmptyMsg = React.useCallback(
    () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />,
    [onClearFilters],
  );

  if (monitoredReleasesError) {
    return getErrorState(monitoredReleasesError, loaded, 'applications');
  }

  const isFiltered =
    name.length > 0 ||
    statuses.length > 0 ||
    applications.length > 0 ||
    releasePlans.length > 0 ||
    selectedNamespaces.length > 0 ||
    components.length > 0 ||
    products.length > 0 ||
    productVersions.length > 0 ||
    filters.showLatest;

  // Show SelectNamespaceEmptyState when:
  // 1. Initial state: no namespaces have been fetched yet
  // 2. Namespace filter cleared: user cleared the namespace filter after having data
  const shouldShowNamespaceSelector =
    loaded &&
    namespaces.length > NAMESPACE_THRESHOLD &&
    (namespacesToFetch.length === 0 || selectedNamespaces.length === 0);

  // When namespace filter is cleared, show empty data to trigger NoDataEmptyMsg (SelectNamespaceEmptyState)
  const shouldShowEmptyForNamespaceFilter =
    namespaces.length > NAMESPACE_THRESHOLD &&
    selectedNamespaces.length === 0 &&
    releases.length > 0;

  const displayData = shouldShowEmptyForNamespaceFilter ? [] : sortedFilteredData;
  const unfilteredDisplayData = shouldShowEmptyForNamespaceFilter ? [] : releases;

  return (
    <PageLayout
      title="Release Monitor"
      description="The dashboard to monitor the releases you care about"
    >
      <PageSection isFilled={false}>
        {(isFiltered ||
          releases.length > 0 ||
          namespacesToFetch.length > 0 ||
          (loaded && namespaces.length > NAMESPACE_THRESHOLD)) && (
          <>
            <MonitoredReleasesFilterToolbar
              filters={filters}
              setFilters={handleSetFilters}
              onClearFilters={onClearFilters}
              statusOptions={filterOptions.statusOptions}
              applicationOptions={filterOptions.applicationOptions}
              releasePlanOptions={filterOptions.releasePlanOptions}
              namespaceOptions={filterOptions.namespaceOptions}
              componentOptions={filterOptions.componentOptions}
              productOptions={filterOptions.productOptions}
              productVersionOptions={filterOptions.productVersionOptions}
            />
            <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} className="pf-v6-u-mr-xl">
              <FlexItem>
                <Label
                  color="blue"
                  className="pf-v6-u-font-weight-bold"
                  data-test="release-count-label"
                >
                  {pluralize(displayData.length, 'release')}
                </Label>
              </FlexItem>
            </Flex>
          </>
        )}

        <Table
          virtualize
          data={displayData}
          unfilteredData={unfilteredDisplayData}
          EmptyMsg={EmptyMsg}
          NoDataEmptyMsg={
            shouldShowNamespaceSelector ? SelectNamespaceEmptyState : MonitoredReleaseEmptyState
          }
          aria-label="Release List"
          Header={ReleasesListHeader}
          Row={ReleaseListRow}
          loaded={!loading || releases.length > 0}
        />
      </PageSection>
    </PageLayout>
  );
};

export default ReleaseMonitorListView;
