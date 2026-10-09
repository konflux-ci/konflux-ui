import { Link } from 'react-router-dom';
import {
  Alert,
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Skeleton,
  Spinner,
} from '@patternfly/react-core';
import { NAMESPACE_PIPELINE_RUN_DETAILS_PATH } from '@routes/paths';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { DetailsSection } from '~/components/DetailsPage';
import ScanDescriptionListGroup from '~/components/PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind, ImageRepositoryVisibility, PipelineRunKind } from '~/types';
import { createCommitObjectFromPLR } from '~/utils/commits-utils';
import { getImageUrlForVisibility } from '~/utils/component-utils';
import { getPipelineRunStatusResults, SBOMResultKeys } from '~/utils/pipeline-utils';

const IMAGE_URL_RESULT = 'IMAGE_URL';

const SelectedBuild: React.FC<{ component: ComponentKind; pipelineRun: PipelineRunKind }> = ({
  component,
  pipelineRun,
}) => {
  const namespace = component.metadata.namespace;
  const [taskRuns, tasksLoaded, tasksError] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRun.metadata.name,
    undefined,
    false,
  );
  const [proxy, proxyLoaded, proxyError] = useImageProxy();
  const [repository, repositoryLoaded, repositoryError] = useImageRepository(
    namespace,
    component.metadata.name,
    null,
    false,
  );
  const { isImageControllerEnabled } = useIsImageControllerEnabled();
  const results = getPipelineRunStatusResults(pipelineRun);
  const imageUrl = results?.find((result) => result.name === IMAGE_URL_RESULT)?.value;
  const digest = results?.find((result) => result.name === SBOMResultKeys.IMAGE_DIGEST)?.value;
  // Strip an existing tag/digest without removing a registry port.
  const image =
    imageUrl && digest ? `${imageUrl.split('@')[0].replace(/:[^/:]+$/, '')}@${digest}` : imageUrl;
  const visibility = isImageControllerEnabled ? repository?.spec.image?.visibility : null;
  const displayImage = getImageUrlForVisibility(
    image,
    visibility,
    proxyError || repositoryError ? null : proxy?.hostname,
  );
  const imageLoading =
    isImageControllerEnabled &&
    ((!repositoryLoaded && !repositoryError) ||
      (visibility === ImageRepositoryVisibility.private && !proxyLoaded && !proxyError));
  const commit = createCommitObjectFromPLR(pipelineRun);
  const routeParams = { workspaceName: namespace, pipelineRunName: pipelineRun.metadata.name };
  const version = pipelineRun.metadata.labels?.[PipelineRunLabel.COMPONENT_VERSION];

  return (
    <Grid hasGutter>
      <GridItem lg={6}>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Build pipeline run</DescriptionListTerm>
            <DescriptionListDescription>
              <Link to={NAMESPACE_PIPELINE_RUN_DETAILS_PATH.createPath(routeParams)}>
                {pipelineRun.metadata.name}
              </Link>
              <div>
                Completed at{' '}
                {pipelineRun.status?.completionTime ? (
                  <Timestamp timestamp={pipelineRun.status.completionTime} />
                ) : (
                  '-'
                )}
              </div>
              <Link to={NAMESPACE_PIPELINE_RUN_DETAILS_PATH.extend('logs').createPath(routeParams)}>
                View build logs
              </Link>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Triggered by</DescriptionListTerm>
            <DescriptionListDescription>
              {commit ? (
                <>
                  {commit.shaTitle}{' '}
                  {commit.shaURL ? (
                    <CommitLabel
                      gitProvider={commit.gitProvider}
                      sha={commit.sha}
                      shaURL={commit.shaURL}
                    />
                  ) : (
                    commit.sha
                  )}
                </>
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>{version || '-'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </GridItem>
      <GridItem lg={6}>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>SBOM</DescriptionListTerm>
            <DescriptionListDescription>
              {imageLoading ? (
                <Skeleton aria-label="Loading SBOM command" />
              ) : displayImage ? (
                <ClipboardCopy
                  isReadOnly
                  hoverTip="Copy"
                  clickTip="Copied"
                >{`cosign download sbom ${displayImage}`}</ClipboardCopy>
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Latest image</DescriptionListTerm>
            <DescriptionListDescription>
              {imageLoading ? (
                <Skeleton aria-label="Loading image URL" />
              ) : displayImage ? (
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                  {displayImage}
                </ClipboardCopy>
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <ScanDescriptionListGroup
            taskRuns={tasksLoaded && !tasksError ? taskRuns : []}
            pipelineRun={pipelineRun}
            showLogsLink
            popoverAppendTo={false}
            errorState={
              getErrorState(tasksError, tasksLoaded, 'task runs', true) ||
              (!tasksLoaded && <Skeleton aria-label="Loading scans" />)
            }
          />
        </DescriptionList>
      </GridItem>
    </Grid>
  );
};

const ComponentSuccessfulBuild: React.FC<{
  component: ComponentKind;
  pipelineRun?: PipelineRunKind;
  loaded: boolean;
  error?: unknown;
}> = ({ component, pipelineRun, loaded, error }) => (
  <DetailsSection title="Latest build" description="Information from the latest successful build.">
    {error ? (
      getErrorState(error, true, 'pipeline run', true)
    ) : !loaded ? (
      <Spinner aria-label="Loading successful build" />
    ) : pipelineRun ? (
      <SelectedBuild
        key={pipelineRun.metadata.name}
        component={component}
        pipelineRun={pipelineRun}
      />
    ) : (
      <Alert variant="info" isInline title="No successful build pipeline available" />
    )}
  </DetailsSection>
);

export default ComponentSuccessfulBuild;
