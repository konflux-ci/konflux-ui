import * as React from 'react';
import {
  Alert,
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Spinner,
} from '@patternfly/react-core';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { StatusIconWithTextLabel } from '~/components/StatusIcon/StatusIcon';
import { useLatestBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind } from '~/types';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

type LatestBuildSectionProps = {
  component: ComponentKind;
  version?: string;
};

const LatestBuildSection: React.FC<LatestBuildSectionProps> = ({ component, version }) => {
  const namespace = useNamespace();

  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useLatestBuildPipelineRunForComponentV2(namespace, component.metadata.name, version);

  const commit = React.useMemo(
    () => ((pipelineRunLoaded && pipelineRun && getCommitsFromPLRs([pipelineRun], 1)) || [])[0],
    [pipelineRunLoaded, pipelineRun],
  );

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run', true);
  }

  if (!pipelineRunLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!pipelineRun) {
    return <Alert variant="info" isInline title="No build pipeline available" />;
  }

  const status = pipelineRunStatus(pipelineRun);

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
          <Flex direction={{ default: 'row' }}>
            <StatusIconWithTextLabel status={status} />
            {pipelineRun.metadata?.name ?? '-'}
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default React.memo(LatestBuildSection);
