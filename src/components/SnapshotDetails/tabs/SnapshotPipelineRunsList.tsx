import * as React from 'react';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRunsFilter } from '../../../hooks/usePipelineRunsFilter';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { Table } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import { createFilterObj } from '../../Filter/utils/pipelineruns-filter-utils';
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
  const {
    filterPLRs,
    filterState: { nameFilter },
    filterToolbar,
    onClearFilters,
  } = usePipelineRunsFilter();

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

  const filteredPLRs = React.useMemo(
    () => filterPLRs(snapshotPipelineRuns).filter((plr) => !customFilter || customFilter(plr)),
    [customFilter, snapshotPipelineRuns, filterPLRs],
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

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={onClearFilters} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  return (
    <>
      <Title
        headingLevel="h4"
        className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg"
        data-test="snapshot-plr-title"
      >
        Pipeline runs
      </Title>
      {filteredPLRs.length > 0 ? (
        <Table
          key={`${snapshotPipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
          data={filteredPLRs}
          aria-label="Pipeline run List"
          Toolbar={filterToolbar(statusFilterObj, typeFilterObj)}
          customData={vulnerabilities}
          Header={PipelineRunListHeaderWithVulnerabilities}
          Row={PipelineRunListRowWithVulnerabilities}
          EmptyMsg={EmptyMsg}
          NoDataEmptyMsg={NoDataEmptyMsg}
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
      ) : (
        <FilteredEmptyState onClearFilters={onClearFilters} />
      )}
    </>
  );
};

export default SnapshotPipelineRunsList;
