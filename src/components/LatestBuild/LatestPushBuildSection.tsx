import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Flex, FlexItem, Skeleton } from '@patternfly/react-core';
import { COMPONENT_VERSION_DETAILS_PATH } from '@routes/paths';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useLatestPushBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import PipelineRunStatus from '../PipelineRun/PipelineRunStatus';

import './LatestPushBuildSection.scss';

type LatestBuildSectionProps = {
  componentName: string;
  version?: string;
};

const LatestPushBuildSection: React.FC<LatestBuildSectionProps> = ({ componentName, version }) => {
  const namespace = useNamespace();

  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useLatestPushBuildPipelineRunForComponentV2(namespace, componentName, version);

  const commit = React.useMemo(
    () => ((pipelineRunLoaded && pipelineRun && getCommitsFromPLRs([pipelineRun], 1)) || [])[0],
    [pipelineRunLoaded, pipelineRun],
  );

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run', true);
  }

  if (!pipelineRunLoaded) {
    return <Skeleton data-test="latest-build-loading" />;
  }

  if (!pipelineRun) {
    return <Alert variant="info" isInline title="No build pipeline available" />;
  }

  const actualVersion =
    version ?? pipelineRun?.metadata?.labels?.[PipelineRunLabel.COMPONENT_VERSION];

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
      <PipelineRunStatus pipelineRun={pipelineRun} />
      {commit && (
        <Flex
          direction={{ default: 'row' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
          flexWrap={{ default: 'nowrap' }}
          gap={{ default: 'gapXs' }}
        >
          <FlexItem className="latest-build__label">
            {/* TODO: replace with a link to the commit details page, once the new version is implemented */}
            {`${commit.isPullRequest ? `#${commit.pullRequestNumber} ` : ''}${commit.shaTitle}`}
          </FlexItem>
          {commit.shaURL && (
            <FlexItem flex={{ default: 'flexNone' }}>
              <CommitLabel
                gitProvider={commit.gitProvider}
                sha={commit.sha}
                shaURL={commit.shaURL}
              />
            </FlexItem>
          )}
        </Flex>
      )}
      {actualVersion && (
        <Flex alignItems={{ default: 'alignItemsBaseline' }} gap={{ default: 'gapXs' }}>
          <FlexItem flex={{ default: 'flexNone' }}>
            <strong>Built from</strong>
          </FlexItem>
          <FlexItem className="latest-build__label">
            <Link
              data-test="latest-build-version"
              to={COMPONENT_VERSION_DETAILS_PATH.createPath({
                workspaceName: namespace,
                componentName,
                versionRevision: actualVersion,
              })}
            >
              {actualVersion}
            </Link>
          </FlexItem>
        </Flex>
      )}
    </Flex>
  );
};

export default LatestPushBuildSection;
