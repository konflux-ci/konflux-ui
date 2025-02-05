import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack, Title } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { usePipelineRunsFilter } from '../../../../hooks/usePipelineRunsFilter';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../../shared/components/empty-state/FilteredEmptyState';
import { PipelineRunKind } from '../../../../types';
import { statuses } from '../../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../../utils/pipelinerun-utils';
import { createFilterObj } from '../../../Filter/utils/pipelineruns-filter-utils';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import { useWorkspaceInfo } from '../../../Workspace/useWorkspaceInfo';

const CommitsPipelineRunTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const { namespace, workspace } = useWorkspaceInfo();
  const {
    filterPLRs,
    filterState: { nameFilter },
    filterToolbar,
    onClearFilters,
  } = usePipelineRunsFilter();
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsForCommit(namespace, workspace, applicationName, commitName);

  const statusFilterObj = React.useMemo(
    () => createFilterObj(pipelineRuns, (plr) => pipelineRunStatus(plr), statuses),
    [pipelineRuns],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
      ),
    [pipelineRuns],
  );

  const filteredPLRs = React.useMemo(() => filterPLRs(pipelineRuns), [filterPLRs, pipelineRuns]);

  const vulnerabilities = usePLRVulnerabilities(nameFilter ? filteredPLRs : pipelineRuns);

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

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={onClearFilters} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg">
        Pipeline runs
      </Title>
      <div>
        <Table
          key={`${pipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
          unfilteredData={pipelineRuns}
          data={filteredPLRs}
          aria-label="Pipelinerun List"
          Header={PipelineRunListHeaderWithVulnerabilities}
          Toolbar={filterToolbar(statusFilterObj, typeFilterObj)}
          loaded={isFetchingNextPage || loaded}
          customData={vulnerabilities}
          EmptyMsg={EmptyMsg}
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
