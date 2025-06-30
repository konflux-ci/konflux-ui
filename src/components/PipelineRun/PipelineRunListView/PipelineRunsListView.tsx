import * as React from 'react';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { HttpError } from '../../../k8s/error';
import { Table, useDeepCompareMemoize } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbar from '../../Filter/toolbars/PipelineRunsFilterToolbar';
import {
  filterPipelineRuns,
  PipelineRunsFilterState,
} from '../../Filter/utils/pipelineruns-filter-utils';
import PipelineRunEmptyState from '../PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from './PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from './PipelineRunListRow';

type PipelineRunsListViewProps = {
  applicationName: string;
  componentName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
};

const PipelineRunsListView: React.FC<React.PropsWithChildren<PipelineRunsListViewProps>> = ({
  applicationName,
  componentName,
  customFilter,
}) => {
  const namespace = useNamespace();
  const [application, applicationLoaded] = useApplication(namespace, applicationName);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    commit: unparsedFilters.commit ? (unparsedFilters.commit as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });

  const { name, status, type } = filters;

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      applicationLoaded ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
            filterByName: name || undefined,
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              ...(componentName && {
                [PipelineRunLabel.COMPONENT]: componentName,
              }),
            },
          },
        }),
        [applicationName, componentName, application, name],
      ),
    );

  const sortedPipelineRuns = React.useMemo((): PipelineRunKind[] => {
    if (!pipelineRuns) return [];

    // @ts-expect-error: toSorted might not be in TS yet
    if (typeof pipelineRuns.toSorted === 'function') {
      // @ts-expect-error: toSorted might not be in TS yet
      return pipelineRuns.toSorted((a, b) =>
        b.status?.startTime?.localeCompare(a.status?.startTime),
      );
    }

    return [...pipelineRuns].sort((a, b) =>
      b.status?.startTime?.localeCompare(a.status?.startTime),
    );
  }, [pipelineRuns]);

  // Create filtered datasets for calculating available options
  // Each excludes its own filter type but includes all others
  const filtersForStatusOptions = React.useMemo(
    () =>
      filterPipelineRuns(
        sortedPipelineRuns,
        {
          name: filters.name,
          commit: filters.commit,
          status: [], // Exclude status to show available status options
          type: filters.type,
        },
        customFilter,
      ),
    [sortedPipelineRuns, filters.name, filters.commit, filters.type, customFilter],
  );

  const filtersForTypeOptions = React.useMemo(
    () =>
      filterPipelineRuns(
        sortedPipelineRuns,
        {
          name: filters.name,
          commit: filters.commit,
          status: filters.status,
          type: [], // Exclude type to show available type options
        },
        customFilter,
      ),
    [sortedPipelineRuns, filters.name, filters.commit, filters.status, customFilter],
  );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(filtersForStatusOptions, (plr) => pipelineRunStatus(plr), statuses),
    [filtersForStatusOptions],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        filtersForTypeOptions,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
      ),
    [filtersForTypeOptions],
  );

  const filteredPLRs = React.useMemo(
    () => filterPipelineRuns(sortedPipelineRuns, filters, customFilter),
    [sortedPipelineRuns, filters, customFilter],
  );

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : sortedPipelineRuns);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  if (error) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load pipeline runs"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  const isFiltered = String(name).length > 0 || type.length > 0 || status.length > 0;

  return (
    <>
      {(isFiltered || sortedPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbar
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          typeOptions={typeFilterObj}
          statusOptions={statusFilterObj}
        />
      )}
      <Table
        data={filteredPLRs}
        unfilteredData={sortedPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={PipelineRunListHeaderWithVulnerabilities}
        Row={PipelineRunListRowWithVulnerabilities}
        loaded={isFetchingNextPage || loaded}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            hasNextPage && !isFetchingNextPage && getNextPage?.();
          },
          rowCount: hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
      {isFetchingNextPage ? (
        <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }} hasGutter>
          <Bullseye>
            <Spinner size="lg" aria-label="Loading more pipeline runs" />
          </Bullseye>
        </Stack>
      ) : null}
    </>
  );
};

export default PipelineRunsListView;
