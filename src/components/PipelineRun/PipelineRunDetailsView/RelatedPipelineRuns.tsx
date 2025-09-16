import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, Popover, Skeleton } from '@patternfly/react-core';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsV2';
import { PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunGroupVersionKind } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { getCommitSha } from '../../../utils/commits-utils';

const RelatedPipelineRuns: React.FC<{ pipelineRun: PipelineRunKind }> = ({ pipelineRun }) => {
  const namespace = useNamespace();

  const sha = getCommitSha(pipelineRun);
  const applicationName: string = pipelineRun.metadata?.labels[PipelineRunLabel.APPLICATION];

  const [pipelineRuns, relatedPipelineRunsLoaded] = usePipelineRunsForCommitV2(
    namespace,
    applicationName,
    sha,
  );

  const relatedPipelineRuns = React.useMemo(
    () =>
      pipelineRuns
        ?.filter((plr) => plr.metadata.name !== pipelineRun.metadata.name)
        .filter((plr) => plr.kind === PipelineRunGroupVersionKind.kind),
    [pipelineRun.metadata.name, pipelineRuns],
  );

  return relatedPipelineRunsLoaded || !sha ? (
    <Popover
      data-test="related-pipelines-popover"
      aria-label="Related pipelines"
      headerContent="Related pipelines"
      bodyContent={
        relatedPipelineRuns.length === 0
          ? 'No related pipelines'
          : relatedPipelineRuns?.map((relatedPipelineRun: PipelineRunKind) => (
              <div key={relatedPipelineRun?.metadata?.uid}>
                <Link
                  to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName,
                    pipelineRunName: relatedPipelineRun.metadata?.name,
                  })}
                  title={relatedPipelineRun.metadata?.name}
                >
                  {relatedPipelineRun.metadata?.name}
                </Link>
              </div>
            ))
      }
    >
      <Button variant="link" isInline>
        {`${relatedPipelineRuns?.length} ${
          relatedPipelineRuns?.length === 1 ? 'pipeline' : 'pipelines'
        }`}
      </Button>
    </Popover>
  ) : (
    <Skeleton width="50%" screenreaderText="Loading related pipelines" />
  );
};

export default RelatedPipelineRuns;
