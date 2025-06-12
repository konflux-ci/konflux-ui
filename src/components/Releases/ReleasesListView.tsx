import * as React from 'react';
import { useParams } from 'react-router-dom';
import { PageSection, PageSectionVariants, Title, Spinner, Bullseye } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useK8sAndKarchResources } from '../../hooks/useK8sAndKarchResources';
import { useSortedResources } from '../../hooks/useSortedResources';
import { ReleaseGroupVersionKind, ReleaseModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { Table, useDeepCompareMemoize } from '../../shared';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../shared/providers/Namespace';
import { ReleaseKind } from '../../types';
import { FilterContext } from '../Filter/generic/FilterContext';
import { ReleasesFilterToolbar } from '../Filter/toolbars/ReleasesFilterToolbar';
import ReleasesEmptyState from './ReleasesEmptyState';
import getReleasesListHeader, { SortableHeaders } from './ReleasesListHeader';
import ReleasesListRow from './ReleasesListRow';

enum FilterTypes {
  name = 'name',
  releasePlan = 'release plan',
  releaseSnapshot = 'release snapshot',
}

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.name]: 'metadata.name',
  [SortableHeaders.created]: 'metadata.creationTimestamp',
};

const ReleasesListView: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const {
    data: releases,
    isLoading,
    hasError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useK8sAndKarchResources<ReleaseKind>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
      selector: applicationName
        ? {
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
            },
          }
        : undefined,
    },
    ReleaseModel,
  );

  const [filterType, setFilterType] = React.useState<FilterTypes>(FilterTypes.name);
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.created);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.desc,
  );

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    [filterType]: unparsedFilters[filterType] ? (unparsedFilters[filterType] as string) : '',
  });

  const { [filterType]: searchFilter } = filters;

  const ReleasesListHeader = React.useMemo(
    () =>
      getReleasesListHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  const filteredReleases = React.useMemo(() => {
    if (isLoading && !releases.length) return [];
    switch (filterType) {
      case FilterTypes.name:
        return releases.filter((r) => r.metadata.name.indexOf(searchFilter) !== -1);
      case FilterTypes.releasePlan:
        return releases.filter((r) => r.spec.releasePlan.indexOf(searchFilter) !== -1);
      case FilterTypes.releaseSnapshot:
        return releases.filter((r) => r.spec.snapshot.indexOf(searchFilter) !== -1);
      default:
        return releases;
    }
  }, [filterType, isLoading, releases, searchFilter]);

  const sortedReleases = useSortedResources(
    filteredReleases,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  if (isLoading && !releases.length) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!isLoading && !releases?.length && !hasError) {
    return <ReleasesEmptyState />;
  }

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <Title size="lg" headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Releases
      </Title>
      <>
        <ReleasesFilterToolbar
          value={searchFilter}
          dropdownItems={Object.values(FilterTypes)}
          onInput={(value) => setFilters({ [filterType]: value })}
          onFilterTypeChange={(val) => {
            setFilters({ ...filters, [filterType]: '' });
            setFilterType(val as FilterTypes);
          }}
        />
        {!sortedReleases?.length ? (
          <FilteredEmptyState onClearFilters={() => onClearFilters()} />
        ) : (
          <Table
            data-test="releases__table"
            data={sortedReleases}
            aria-label="Release List"
            Header={ReleasesListHeader}
            Row={ReleasesListRow}
            loaded={!isLoading || releases.length > 0}
            getRowProps={(obj: ReleaseKind) => ({
              id: obj?.metadata?.uid,
            })}
            customData={{ applicationName }}
            isInfiniteLoading={hasNextPage}
            infiniteLoaderProps={{
              isRowLoaded: (args) => {
                return !!sortedReleases[args.index];
              },
              loadMoreRows: () => {
                hasNextPage && !isFetchingNextPage && fetchNextPage?.();
              },
              rowCount: hasNextPage ? sortedReleases.length + 1 : sortedReleases.length,
            }}
          />
        )}
      </>
    </PageSection>
  );
};

export default ReleasesListView;
