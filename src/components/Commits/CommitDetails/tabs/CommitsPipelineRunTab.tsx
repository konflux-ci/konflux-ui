import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useDeepCompareMemoize } from '~/k8s/hooks/useK8sQueryWatch';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../../consts/pipeline';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import FilteredEmptyState from '../../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../../shared/components/table/ColumnManagement';
import { useLocalStorage } from '../../../../shared/hooks/useLocalStorage';
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
import { getPipelineRunListHeader } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';

const CommitsPipelineRunTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [
    testPipelineRuns,
    testPlrLoaded,
    testPlrError,
    testPlrGetNextPage,
    { isFetchingNextPage: testPlrIsFetchingNextPage, hasNextPage: testPlrHasNextPage },
  ] = usePipelineRunsForCommitV2(
    namespace,
    applicationName,
    commitName,
    undefined,
    false,
    PipelineRunType.TEST,
  );

  // To ensure correct order of pipeline runs while the queries are split based on type, we need to first fetch
  // all test pipeline runs before fetching any build pipeline runs. Test pipeline runs are only started after
  // build pipeline runs are finished.
  const shouldFetchBuildPlr =
    testPlrLoaded && !testPlrError && !testPlrIsFetchingNextPage && !testPlrHasNextPage;

  const [
    buildPipelineRuns,
    buildPlrLoaded,
    buildPlrError,
    buildPlrGetNextPage,
    { isFetchingNextPage: buildPlrIsFetchingNextPage, hasNextPage: buildPlrHasNextPage },
  ] = usePipelineRunsForCommitV2(
    shouldFetchBuildPlr ? namespace : null,
    applicationName,
    commitName,
    undefined,
    false,
    PipelineRunType.BUILD,
  );
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useLocalStorage<string[]>(
    `commit-pipeline-runs-columns-${applicationName}-${commitName}`,
  );

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(visibleColumnKeys) && visibleColumnKeys.length > 0) {
      return new Set(visibleColumnKeys as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS);
  }, [visibleColumnKeys]);

  const { name, status, type } = filters;

  const pipelineRuns = React.useMemo(
    () => [...(testPipelineRuns ?? []), ...(buildPipelineRuns ?? [])],
    [buildPipelineRuns, testPipelineRuns],
  );
  const pipelineRunsLoaded = testPlrLoaded && (shouldFetchBuildPlr ? buildPlrLoaded : true);
  const pipelineRunsError = testPlrError ?? buildPlrError;

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

  const filteredPLRs = React.useMemo(
    () => filterPipelineRuns(pipelineRuns, filters),
    [pipelineRuns, filters],
  );

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : pipelineRuns);

  if (pipelineRunsError) {
    return getErrorState(pipelineRunsError, pipelineRunsLoaded, 'pipeline runs');
  }

  if (pipelineRunsLoaded && (!pipelineRuns || pipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  const isFiltered = name.length > 0 || type.length > 0 || status.length > 0;
  const isFetchingNextPage = testPlrIsFetchingNextPage || buildPlrIsFetchingNextPage;
  const hasNextPage = testPlrHasNextPage || buildPlrHasNextPage;

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
            openColumnManagement={() => setIsColumnManagementOpen(true)}
            totalColumns={PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
          />
        )}
        <Table
          key={`${pipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
          unfilteredData={pipelineRuns}
          data={filteredPLRs}
          aria-label="Pipelinerun List"
          Header={getPipelineRunListHeader(safeVisibleColumns)}
          loaded={isFetchingNextPage || pipelineRunsLoaded}
          customData={vulnerabilities}
          EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
          NoDataEmptyMsg={NoDataEmptyMsg}
          Row={(props) => (
            <PipelineRunListRowWithColumns
              obj={props.obj as PipelineRunKind}
              columns={props.columns || []}
              customData={vulnerabilities}
              index={props.index}
              visibleColumns={safeVisibleColumns}
            />
          )}
          getRowProps={(obj: PipelineRunKind) => ({
            id: obj.metadata.name,
          })}
          isInfiniteLoading
          infiniteLoaderProps={{
            isRowLoaded: (args) => {
              return !!filteredPLRs[args.index];
            },
            loadMoreRows: () => {
              if (testPlrHasNextPage && !testPlrIsFetchingNextPage && testPlrLoaded) {
                testPlrGetNextPage?.();
              } else if (
                testPlrLoaded &&
                !testPlrHasNextPage &&
                buildPlrHasNextPage &&
                !buildPlrIsFetchingNextPage
              ) {
                buildPlrGetNextPage?.();
              }
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
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setVisibleColumnKeys(Array.from(cols))}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default CommitsPipelineRunTab;
