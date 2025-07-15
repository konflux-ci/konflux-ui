import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePipelineRuns } from '../../../../hooks/usePipelineRuns';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import { useErrorState } from '../../../../shared/hooks/useErrorState';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeader } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRow } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
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

  const errorState = useErrorState(error, loaded, 'pipeline runs');

  if (error) {
    return errorState;
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
      <Table
        data={pipelineRuns}
        aria-label="Pipeline run List"
        Header={PipelineRunListHeader}
        Row={PipelineRunListRow}
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
        customData={{ integrationTestName }}
      />
    </>
  );
};

export default IntegrationTestPipelineRunTab;
