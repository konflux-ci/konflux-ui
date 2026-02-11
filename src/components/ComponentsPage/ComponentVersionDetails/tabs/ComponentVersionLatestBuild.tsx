import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
  ClipboardCopy,
  Spinner,
  Button,
} from '@patternfly/react-core';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { getErrorState } from '~/shared/utils/error-utils';
import { COMMIT_DETAILS_PATH } from '../../../../routes/paths';
import { Timestamp } from '../../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind, ImageRepositoryVisibility } from '../../../../types';
import { getCommitsFromPLRs } from '../../../../utils/commits-utils';
import { getImageUrlForVisibility } from '../../../../utils/component-utils';
import { getPipelineRunStatusResults } from '../../../../utils/pipeline-utils';
import CommitLabel from '../../../Commits/commit-label/CommitLabel';
import { useBuildLogViewerModal } from '../../../LogViewer/BuildLogViewer';
import ScanDescriptionListGroup from '../../../PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';

type ComponentVersionLatestBuildProps = {
  component: ComponentKind;
  branchName: string;
};

const ComponentVersionLatestBuild: React.FC<
  React.PropsWithChildren<ComponentVersionLatestBuildProps>
> = ({ component, branchName }) => {
  const namespace = useNamespace();
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2(
      namespace,
      component.metadata.name,
      branchName,
    );
  const commit = React.useMemo(
    () => ((pipelineRunLoaded && pipelineRun && getCommitsFromPLRs([pipelineRun], 1)) || [])[0],
    [pipelineRunLoaded, pipelineRun],
  );
  const [taskRuns, taskRunsLoaded, taskRunsError] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRun?.metadata?.name,
  );
  const buildLogsModal = useBuildLogViewerModal(component);
  const [urlInfo, proxyLoaded, proxyError] = useImageProxy();

  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    component.metadata.namespace,
    component.metadata.name,
    false,
  );

  const imageUrlFromPlr =
    pipelineRun?.status &&
    getPipelineRunStatusResults(pipelineRun).find((r) => r.name === 'IMAGE_URL')?.value;
  const displayImageUrl =
    imageUrlFromPlr &&
    getImageUrlForVisibility(
      imageUrlFromPlr,
      imageRepository?.spec?.image?.visibility ?? null,
      proxyError || imageRepoError || !urlInfo ? null : urlInfo.hostname,
    );

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run', true);
  }

  const isPrivate = imageRepository?.spec?.image?.visibility === ImageRepositoryVisibility.private;
  if (
    !pipelineRunLoaded ||
    !taskRunsLoaded ||
    (!imageRepoLoaded && !imageRepoError) ||
    (isPrivate && !proxyLoaded && !proxyError)
  ) {
    return (
      <div className="pf-u-m-lg">
        <Spinner />
      </div>
    );
  }

  if (!pipelineRun) {
    return (
      <Alert
        variant="danger"
        isInline
        title="No successful build pipeline available for this branch"
      />
    );
  }

  return (
    <Flex direction={{ default: 'row' }}>
      <FlexItem style={{ flex: 1 }}>
        <DescriptionList
          columnModifier={{
            default: '1Col',
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Build pipeline run</DescriptionListTerm>
            <DescriptionListDescription>
              <div className="component-details__build-completion">
                <div className="component-details__build-completion--time">
                  <div>Completed at</div>
                  <Timestamp timestamp={pipelineRun?.status?.completionTime ?? '-'} />
                </div>
                <Button
                  onClick={buildLogsModal}
                  variant="link"
                  data-test={`view-build-logs-${component.metadata.name}-${branchName}`}
                  isInline
                >
                  View build logs
                </Button>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Triggered by</DescriptionListTerm>
            <DescriptionListDescription>
              {commit ? (
                <>
                  <Link
                    to={COMMIT_DETAILS_PATH.createPath({
                      workspaceName: namespace,
                      applicationName: commit.application,
                      commitName: commit.sha,
                    })}
                  >
                    {commit.isPullRequest ? `#${commit.pullRequestNumber}` : ''} {commit.shaTitle}
                  </Link>
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
        </DescriptionList>
      </FlexItem>
      <FlexItem style={{ flex: 1 }}>
        <DescriptionList
          columnModifier={{
            default: '1Col',
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>SBOM</DescriptionListTerm>
            <DescriptionListDescription>
              {displayImageUrl ? (
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" data-test="sbom-test">
                  {`cosign download sbom ${displayImageUrl}`}
                </ClipboardCopy>
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Build container image</DescriptionListTerm>
            <DescriptionListDescription>
              {displayImageUrl ? (
                <ClipboardCopy
                  isReadOnly
                  hoverTip="Copy"
                  clickTip="Copied"
                  data-test="build-container-image-test"
                >
                  {displayImageUrl}
                </ClipboardCopy>
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <ScanDescriptionListGroup
            taskRuns={taskRuns}
            showLogsLink
            errorState={getErrorState(taskRunsError, taskRunsLoaded, 'task runs', true)}
          />
        </DescriptionList>
      </FlexItem>
    </Flex>
  );
};

export default React.memo(ComponentVersionLatestBuild);
