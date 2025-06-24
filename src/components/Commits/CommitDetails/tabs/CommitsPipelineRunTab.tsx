import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { useDeepCompareMemoize } from '~/k8s/hooks/useK8sQueryWatch';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import { statuses } from '../../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbar from '../../../Filter/toolbars/PipelineRunsFilterToolbar';
import {
  filterPipelineRuns,
  PipelineRunsFilterState,
} from '../../../Filter/utils/pipelineruns-filter-utils';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';

const CommitsPipelineRunTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsForCommit(namespace, applicationName, commitName, undefined, false);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    commit: unparsedFilters.commit ? (unparsedFilters.commit as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });

  const { name, status, type } = filters;

  const filtersForStatusOptions = React.useMemo(
    () =>
      filterPipelineRuns(pipelineRuns, {
        name: filters.name,
        commit: filters.commit,
        status: [],
        type: filters.type,
      }),
    [pipelineRuns, filters.name, filters.commit, filters.type],
  );

  const filtersForTypeOptions = React.useMemo(
    () =>
      filterPipelineRuns(pipelineRuns, {
        name: filters.name,
        commit: filters.commit,
        status: filters.status,
        type: [],
      }),
    [pipelineRuns, filters.name, filters.commit, filters.status],
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
    () => filterPipelineRuns(pipelineRuns, filters),
    [pipelineRuns, filters],
  );

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : pipelineRuns);

  if (error) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load pipeline runs"
        body={httpError?.message.length > 0 ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  if (loaded && (!pipelineRuns || pipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  const isFiltered = String(name).length > 0 || type.length > 0 || status.length > 0;

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg">
        Pipeline runs
      </Title>
      <div>
        {(isFiltered || pipelineRuns.length > 0) && (
          <PipelineRunsFilterToolbar
            filters={filters}
            setFilters={setFilters}
            onClearFilters={onClearFilters}
            typeOptions={typeFilterObj}
            statusOptions={statusFilterObj}
          />
        )}
        <Table
          key={`${pipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
          unfilteredData={pipelineRuns}
          data={filteredPLRs}
          aria-label="Pipelinerun List"
          Header={PipelineRunListHeaderWithVulnerabilities}
          loaded={isFetchingNextPage || loaded}
          customData={vulnerabilities}
          EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
          NoDataEmptyMsg={NoDataEmptyMsg}
          Row={PipelineRunListRowWithVulnerabilities}
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
      </div>
    </>
  );
};

export default CommitsPipelineRunTab;
