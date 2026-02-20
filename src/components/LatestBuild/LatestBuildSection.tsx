import * as React from 'react';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
} from '@patternfly/react-core';
import { useLatestSuccessfulBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind } from '~/types';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import CommitLabel from '../Commits/commit-label/CommitLabel';

type LatestBuildSectionProps = {
  component: ComponentKind;
  version?: string;
};

const LatestBuildSection: React.FC<LatestBuildSectionProps> = ({ component, version }) => {
  const namespace = useNamespace();

  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useLatestSuccessfulBuildPipelineRunForComponentV2(namespace, component.metadata.name, version);

  const commit = React.useMemo(
    () => ((pipelineRunLoaded && pipelineRun && getCommitsFromPLRs([pipelineRun], 1)) || [])[0],
    [pipelineRunLoaded, pipelineRun],
  );

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run', true);
  }

  if (!pipelineRunLoaded) {
    return (
      <div className="pf-v5-u-m-lg">
        <Spinner />
      </div>
    );
  }

  if (!pipelineRun) {
    return <Alert variant="info" isInline title="No successful build pipeline available" />;
  }

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>Latest commit</DescriptionListTerm>
        <DescriptionListDescription data-test="latest-build-commit">
          {commit ? (
            <>
              {commit.isPullRequest ? `#${commit.pullRequestNumber}` : ''} {commit.shaTitle}
              {commit.shaURL && (
                <>
                  {' '}
                  <CommitLabel
                    gitProvider={commit.gitProvider}
                    sha={commit.sha}
                    shaURL={commit.shaURL}
                  />
                </>
              )}
            </>
          ) : (
            '-'
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Latest build pipeline run</DescriptionListTerm>
        <DescriptionListDescription data-test="latest-build-pipelinerun">
          {pipelineRun.metadata?.name ?? '-'}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default React.memo(LatestBuildSection);
