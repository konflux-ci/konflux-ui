import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePipelineRuns } from '../../../../hooks/usePipelineRuns';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
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
  const [pipelineRuns, loaded, error, getNextPage] = usePipelineRuns(
    namespace,
    null,
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
          if (loaded && stopIndex === pipelineRuns.length - 1) {
            getNextPage?.();
          }
        }}
      />
    </>
  );
};

export default IntegrationTestPipelineRunTab;
