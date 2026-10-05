import { Link } from 'react-router-dom';
import { Button, Popover, Skeleton } from '@patternfly/react-core';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind } from '~/types';
import { getCommitSha } from '~/utils/commits-utils';
import { getPipelineRunDetailsPath } from '~/utils/pipeline-run-routes';

const RelatedNamespacePipelineRuns = ({ pipelineRun }: { pipelineRun: PipelineRunKind }) => {
  const labels = pipelineRun.metadata.labels;
  const groupName = labels?.[PipelineRunLabel.COMPONENT_GROUP];
  const componentName = labels?.[PipelineRunLabel.COMPONENT];
  const commit = getCommitSha(pipelineRun);
  const enabled = !!commit && !!(groupName || componentName);
  const [runs, loaded, error, getNextPage, { hasNextPage, isFetchingNextPage }] = usePipelineRunsV2(
    enabled ? pipelineRun.metadata.namespace : null,
    {
      selector: {
        matchLabels: groupName
          ? { [PipelineRunLabel.COMPONENT_GROUP]: groupName }
          : { [PipelineRunLabel.COMPONENT]: componentName },
        filterByCommit: commit,
      },
    },
  );
  if (!enabled) return <>-</>;
  if (error) return <>Unable to load related pipeline runs</>;
  if (!loaded) return <Skeleton width="50%" screenreaderText="Loading related pipeline runs" />;
  const relatedRuns = runs.filter((run) => run.metadata.name !== pipelineRun.metadata.name);
  return (
    <Popover
      aria-label="Related pipeline runs"
      headerContent="Related pipeline runs"
      bodyContent={
        <>
          {relatedRuns.length === 0 && !hasNextPage && 'No related pipeline runs'}
          {relatedRuns.map((run) => (
            <div key={run.metadata.uid ?? run.metadata.name}>
              <Link to={getPipelineRunDetailsPath(run)}>{run.metadata.name}</Link>
            </div>
          ))}
          {hasNextPage && (
            <Button
              variant="link"
              isInline
              onClick={getNextPage}
              isDisabled={isFetchingNextPage}
              isLoading={isFetchingNextPage}
            >
              Load more
            </Button>
          )}
        </>
      }
    >
      <Button variant="link" isInline>
        {`${relatedRuns.length}${hasNextPage ? '+' : ''} pipeline ${relatedRuns.length === 1 && !hasNextPage ? 'run' : 'runs'}`}
      </Button>
    </Popover>
  );
};

export default RelatedNamespacePipelineRuns;
