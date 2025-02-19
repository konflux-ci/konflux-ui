import * as React from 'react';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { Table } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbar from '../../Filter/PipelineRunsFilterToolbar';
import { createFilterObj, filterPipelineRuns } from '../../Filter/utils/pipelineruns-filter-utils';
import { PipelineRunsFilterContext } from '../../Filter/utils/PipelineRunsFilterContext';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from '../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from '../../PipelineRun/PipelineRunListView/PipelineRunListRow';

type SnapshotPipelineRunListProps = {
  snapshotPipelineRuns: PipelineRunKind[];
  applicationName: string;
  loaded: boolean;
  getNextPage;
  customFilter?: (plr: PipelineRunKind) => boolean;
  nextPageProps;
};
const SnapshotPipelineRunsList: React.FC<React.PropsWithChildren<SnapshotPipelineRunListProps>> = ({
  snapshotPipelineRuns,
  applicationName,
  loaded,
  getNextPage,
  nextPageProps,
  customFilter,
}) => {
  const { filters, dispatchFilters } = React.useContext(PipelineRunsFilterContext);
  const { nameFilter, statusFilter, typeFilter } = filters;

  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(
        snapshotPipelineRuns,
        (plr) => pipelineRunStatus(plr),
        statuses,
        customFilter,
      ),
    [snapshotPipelineRuns, customFilter],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        snapshotPipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        pipelineRunTypes,
        customFilter,
      ),
    [snapshotPipelineRuns, customFilter],
  );

  const filteredPLRs: PipelineRunKind[] = React.useMemo(
    () => filterPipelineRuns(snapshotPipelineRuns, filters, customFilter),
    [snapshotPipelineRuns, filters, customFilter],
  );

  const vulnerabilities = usePLRVulnerabilities(nameFilter ? filteredPLRs : snapshotPipelineRuns);

  if (!loaded) {
    return (
      <Bullseye data-test="snapshot-plr-loading">
        <Spinner />
      </Bullseye>
    );
  }

  if (!nameFilter && snapshotPipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  if (!snapshotPipelineRuns || snapshotPipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const EmptyMsg = () => (
    <FilteredEmptyState onClearFilters={() => dispatchFilters({ type: 'CLEAR_ALL_FILTERS' })} />
  );
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;
  const isFiltered = nameFilter.length > 0 || typeFilter.length > 0 || statusFilter.length > 0;

  return (
    <>
      <Title
        headingLevel="h4"
        className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg"
        data-test="snapshot-plr-title"
      >
        Pipeline runs
      </Title>
      <Table
        key={`${snapshotPipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
        data={filteredPLRs}
        aria-label="Pipeline run List"
        Toolbar={
          !isFiltered && snapshotPipelineRuns.length === 0 ? null : (
            <PipelineRunsFilterToolbar
              filters={filters}
              dispatchFilters={dispatchFilters}
              typeOptions={typeFilterObj}
              statusOptions={statusFilterObj}
            />
          )
        }
        customData={vulnerabilities}
        Header={PipelineRunListHeaderWithVulnerabilities}
        Row={PipelineRunListRowWithVulnerabilities}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        loaded
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            nextPageProps.hasNextPage && !nextPageProps.isFetchingNextPage && getNextPage?.();
          },
          rowCount: nextPageProps.hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
    </>
  );
};

export default SnapshotPipelineRunsList;
