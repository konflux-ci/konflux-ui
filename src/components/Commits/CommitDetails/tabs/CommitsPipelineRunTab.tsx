import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack, Title } from '@patternfly/react-core';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';

const CommitsPipelineRunTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsForCommit(namespace, applicationName, commitName);

  const vulnerabilities = usePLRVulnerabilities(pipelineRuns);

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

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg">
        Pipeline runs
      </Title>
      <div>
        <Table
          key={`${pipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
          data={pipelineRuns}
          aria-label="Pipelinerun List"
          Header={PipelineRunListHeaderWithVulnerabilities}
          loaded={isFetchingNextPage || loaded}
          customData={vulnerabilities}
          Row={PipelineRunListRowWithVulnerabilities}
          getRowProps={(obj: PipelineRunKind) => ({
            id: obj.metadata.name,
          })}
          isInfiniteLoading
          infiniteLoaderProps={{
            isRowLoaded: (args) => {
              return !!pipelineRuns[args.index];
            },
            loadMoreRows: () => {
              hasNextPage && !isFetchingNextPage && getNextPage?.();
            },
            rowCount: hasNextPage ? pipelineRuns.length + 1 : pipelineRuns.length,
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
