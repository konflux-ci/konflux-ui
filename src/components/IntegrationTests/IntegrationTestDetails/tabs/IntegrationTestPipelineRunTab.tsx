import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import {
  INTEGRATION_TEST_PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../../consts/pipeline';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';
import { usePipelineRuns } from '../../../../hooks/usePipelineRuns';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import ColumnManagement from '../../../../shared/components/table/ColumnManagement';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import { BaseTextFilterToolbar } from '../../../Filter/toolbars/BaseTextFIlterToolbar';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { getPipelineRunListHeader } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import { IntegrationTestLabels } from '../../IntegrationTestForm/types';

const IntegrationTestPipelineRunTab: React.FC<React.PropsWithChildren> = () => {
  const { applicationName, integrationTestName } = useParams<RouterParams>();
  const namespace = useNamespace();

  // Todo add errors here
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      namespace,
      React.useMemo(
        () => ({
          selector: {
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              [IntegrationTestLabels.SCENARIO]: integrationTestName,
            },
          },
        }),
        [applicationName, integrationTestName],
      ),
    );

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [persistedColumns, setPersistedColumns] = useLocalStorage<string[]>(
    `integration-test-pipeline-runs-columns-${applicationName}-${integrationTestName}`,
  );

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(persistedColumns) && persistedColumns.length > 0) {
      return new Set(persistedColumns as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_NO_VULNERABILITIES);
  }, [persistedColumns]);

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

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!pipelineRuns || pipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg">
        Pipeline runs
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
          id: obj.metadata.name,
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
