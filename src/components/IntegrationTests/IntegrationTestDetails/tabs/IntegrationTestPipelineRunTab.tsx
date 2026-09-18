import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { GetNextPage, NextPageProps } from '~/hooks/useTektonResults';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  INTEGRATION_TEST_PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../../consts/pipeline';
import { FeatureFlagIndicator } from '../../../../feature-flags/FeatureFlagIndicator';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ColumnManagement from '../../../../shared/components/table/ColumnManagement';
import { useLocalStorage } from '../../../../shared/hooks/useLocalStorage';
import { PipelineRunKind } from '../../../../types';
import { BaseTextFilterToolbar } from '../../../Filter/toolbars/BaseTextFIlterToolbar';
import { getPipelineRunListHeader } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';

type IntegrationTestPipelineRunTabProps = {
  pipelineRuns: PipelineRunKind[];
  loaded: boolean;
  error: unknown;
  getNextPage: GetNextPage;
  nextPageProps: NextPageProps;
  persistedColumnKey: string;
  PipelineRunEmptyState: React.ElementType;
};

const IntegrationTestPipelineRunTab: React.FC<
  React.PropsWithChildren<IntegrationTestPipelineRunTabProps>
> = ({
  pipelineRuns,
  loaded,
  error,
  getNextPage,
  nextPageProps: { isFetchingNextPage, hasNextPage },
  persistedColumnKey,
  PipelineRunEmptyState,
}) => {
  const { integrationTestName } = useParams<RouterParams>();

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [persistedColumns, setPersistedColumns] = useLocalStorage<string[]>(persistedColumnKey);

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(persistedColumns) && persistedColumns.length > 0) {
      return new Set(persistedColumns as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES);
  }, [persistedColumns]);

  if (error) {
    return getErrorState(error, loaded, 'pipeline runs');
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!pipelineRuns || pipelineRuns.length === 0) {
    return <PipelineRunEmptyState />;
  }

  return (
    <>
      <Title headingLevel="h3" className="pf-v6-c-title pf-v6-u-mt-lg pf-v6-u-mb-lg">
        Pipeline runs <FeatureFlagIndicator flags={['pipelineruns-kubearchive']} />
      </Title>
      {pipelineRuns && pipelineRuns.length > 0 && (
        <BaseTextFilterToolbar
          text=""
          label="name"
          setText={() => {}}
          onClearFilters={() => {}}
          showSearchInput={false}
          openColumnManagement={() => setIsColumnManagementOpen(true)}
          totalColumns={INTEGRATION_TEST_PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
        />
      )}
      <Table
        data={pipelineRuns}
        aria-label="Pipeline run List"
        Header={getPipelineRunListHeader(safeVisibleColumns)}
        Row={(props) => (
          <PipelineRunListRowWithColumns
            obj={props.obj as PipelineRunKind}
            columns={props.columns || []}
            customData={{
              vulnerabilities: {},
              fetchedPipelineRuns: [],
              integrationTestName,
            }}
            index={props.index}
            visibleColumns={safeVisibleColumns}
          />
        )}
        loaded={loaded}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata?.name,
        })}
        onRowsRendered={({ stopIndex }) => {
          if (
            loaded &&
            stopIndex === pipelineRuns.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            getNextPage?.();
          }
        }}
        customData={{
          vulnerabilities: {},
          fetchedPipelineRuns: [],
          integrationTestName,
        }}
      />
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setPersistedColumns(Array.from(cols))}
        columns={INTEGRATION_TEST_PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default IntegrationTestPipelineRunTab;
