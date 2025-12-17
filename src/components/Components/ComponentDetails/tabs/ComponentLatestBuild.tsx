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
import { useImageProxyHost } from '~/hooks/useImageProxyHost';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useLatestSuccessfulBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { getErrorState } from '~/shared/utils/error-utils';
import { COMMIT_DETAILS_PATH } from '../../../../routes/paths';
import { Timestamp } from '../../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind, ImageRepositoryVisibility } from '../../../../types';
import { getCommitsFromPLRs } from '../../../../utils/commits-utils';
import { getImageUrlForVisibility } from '../../../../utils/component-utils';
import CommitLabel from '../../../Commits/commit-label/CommitLabel';
import { useBuildLogViewerModal } from '../../../LogViewer/BuildLogViewer';
import ScanDescriptionListGroup from '../../../PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';

type ComponentLatestBuildProps = {
  component: ComponentKind;
};

const ComponentLatestBuild: React.FC<React.PropsWithChildren<ComponentLatestBuildProps>> = ({
  component,
}) => {
  const namespace = useNamespace();
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useLatestSuccessfulBuildPipelineRunForComponentV2(namespace, component.metadata.name);
  const commit = React.useMemo(
    () => ((pipelineRunLoaded && pipelineRun && getCommitsFromPLRs([pipelineRun], 1)) || [])[0],
    [pipelineRunLoaded, pipelineRun],
  );
  const [taskRuns, taskRunsLoaded, taskRunsError] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRun?.metadata?.name,
  );
  const buildLogsModal = useBuildLogViewerModal(component);
  const [proxyHost, proxyHostLoaded, proxyHostError] = useImageProxyHost();

  // Fetch ImageRepository for this component
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    component.metadata.namespace,
    component.metadata.name,
    false,
  );

  // Avoid getLastestImage fallback to spec.containerImage, which lacks image tag
  // and causes 'cosign download sbom' to fail. Use lastPromotedImage explicitly.
  const containerImage = component?.status?.lastPromotedImage ?? null;

  // Get the appropriate image URL based on visibility
  // When proxyHost or imageRepo has error, fallback to original URL (null triggers fallback in getImageUrlForVisibility)
  const displayImageUrl = getImageUrlForVisibility(
    containerImage,
    imageRepository?.spec?.image?.visibility ?? null,
    proxyHostError || imageRepoError ? null : proxyHost,
  );

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run', true);
  }

  // Note: imageRepoError is handled gracefully by falling back to original URL
  // We don't show error state to avoid blocking the entire component

  // Wait for all required data including proxyHost for private images
  // Once error occurs, fallback to display the content
  const isPrivate = imageRepository?.spec?.image?.visibility === ImageRepositoryVisibility.private;
  if (
    !pipelineRunLoaded ||
    !taskRunsLoaded ||
    (!imageRepoLoaded && !imageRepoError) ||
    (isPrivate && !proxyHostLoaded && !proxyHostError)
  ) {
    return (
      <div className="pf-u-m-lg">
        <Spinner />
      </div>
    );
  }

  if (!pipelineRun) {
    return <Alert variant="danger" isInline title="No successful build pipeline available" />;
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
                  data-test={`view-build-logs-${component.metadata.name}`}
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

export default React.memo(ComponentLatestBuild);
