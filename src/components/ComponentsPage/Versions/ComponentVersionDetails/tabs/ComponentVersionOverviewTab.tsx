import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Spinner,
  Stack,
} from '@patternfly/react-core';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { DetailsSection } from '~/components/DetailsPage';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { useComponent } from '~/hooks/useComponents';
import { useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2 } from '~/hooks/useLatestPushBuildPipeline';
import { COMMIT_DETAILS_PATH, PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import { getCommitsFromPLRs } from '~/utils/commits-utils';
import ComponentVersionLatestBuild from './ComponentVersionLatestBuild';

const ComponentVersionOverviewTab: React.FC = () => {
  const { componentName, versionName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName ?? '');
  const [pipelineRun, pipelineRunLoaded] =
    useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2(
      namespace,
      component?.metadata?.name ?? componentName ?? '',
      versionName,
    );
  const commit = React.useMemo(
    () => (pipelineRunLoaded && pipelineRun && getCommitsFromPLRs([pipelineRun], 1))?.[0] ?? null,
    [pipelineRunLoaded, pipelineRun],
  );

  if (!componentName || !versionName) return null;
  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'component');
  }

  if (!component) {
    return null;
  }

  const applicationName = component.spec?.application;
  const pipelineName = pipelineRun?.spec?.pipelineRef?.name;
  const pipelineRunName = pipelineRun?.metadata?.name;

  return (
    <Stack hasGutter>
      <DetailsSection title="Version details">
        <DescriptionList
          columnModifier={{
            default: '1Col',
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>{versionName}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Git branch</DescriptionListTerm>
            <DescriptionListDescription>
              <GitRepoLink url={component.spec?.source?.url ?? ''} revision={versionName} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Pipeline</DescriptionListTerm>
            <DescriptionListDescription>{pipelineName ?? '-'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Latest commit</DescriptionListTerm>
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
                    {commit.pullRequestNumber ? `#${commit.pullRequestNumber} ` : ''}
                    {commit.shaTitle}
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
          <DescriptionListGroup>
            <DescriptionListTerm>Latest pipelinerun</DescriptionListTerm>
            <DescriptionListDescription>
              {pipelineRunName && applicationName ? (
                <Link
                  to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName,
                    pipelineRunName,
                  })}
                >
                  {pipelineRunName}
                </Link>
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </DetailsSection>
      <DetailsSection
        title="Latest build"
        description="All information is based on the latest successful build of this component for this branch."
      >
        <ComponentVersionLatestBuild component={component} branchName={versionName ?? ''} />
      </DetailsSection>
    </Stack>
  );
};

export default ComponentVersionOverviewTab;
