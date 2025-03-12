import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Spinner,
  Text,
} from '@patternfly/react-core';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { HttpError } from '../../../../k8s/error';
import { PipelineRunGroupVersionKind } from '../../../../models';
import { RouterParams } from '../../../../routes/utils';
import { Timestamp } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../../shared/providers/Namespace';
import {
  createCommitObjectFromPLR,
  createRepoBranchURL,
  createRepoPullRequestURL,
} from '../../../../utils/commits-utils';
import { runStatus } from '../../../../utils/pipeline-utils';
import { StatusIconWithTextLabel } from '../../../topology/StatusIcon';
import CommitLabel from '../../commit-label/CommitLabel';
import { useCommitStatus } from '../../commit-status';
import CommitVisualization from '../../CommitDetails/visualization/CommitVisualization';
import './CommitsOverviewTab.scss';

const CommitOverviewTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [pipelineruns, loaded, loadErr] = usePipelineRunsForCommit(
    namespace,
    applicationName,
    commitName,
  );

  const commit = React.useMemo(
    () =>
      loaded &&
      pipelineruns?.length &&
      createCommitObjectFromPLR(
        pipelineruns.find(
          (p) => p.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
        ),
      ),
    [loaded, pipelineruns],
  );

  const [commitStatus] = useCommitStatus(applicationName, commitName);

  if (loadErr || (loaded && !commit)) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(loadErr ? (loadErr as { code: number }).code : 404)}
        title={`Could not load ${PipelineRunGroupVersionKind.kind}`}
        body={(loadErr as { message: string })?.message ?? 'Not found'}
      />
    );
  }

  if (!commit) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  return (
    <>
      <Text className="pf-v5-u-my-lg">Events progression triggered by the commit.</Text>
      <CommitVisualization commit={commit} />
      <Flex className="pf-v5-u-py-lg">
        <FlexItem flex={{ default: 'flex_3' }}>
          <DescriptionList
            data-test="commit-details"
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Commit</DescriptionListTerm>
              <DescriptionListDescription>
                <CommitLabel
                  gitProvider={commit.gitProvider}
                  sha={commit.sha}
                  shaURL={commit.shaURL}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {commit.isPullRequest ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Pull request</DescriptionListTerm>
                <DescriptionListDescription>
                  {createRepoPullRequestURL(commit) ? (
                    <ExternalLink
                      href={createRepoPullRequestURL(commit)}
                      text={`${commit.pullRequestNumber}`}
                    />
                  ) : (
                    commit.pullRequestNumber
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
            <DescriptionListGroup>
              <DescriptionListTerm>Branch</DescriptionListTerm>
              <DescriptionListDescription>
                {createRepoBranchURL(commit) ? (
                  <ExternalLink href={createRepoBranchURL(commit)} text={`${commit.branch}`} />
                ) : (
                  `${commit.branch || '-'}`
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>By</DescriptionListTerm>
              <DescriptionListDescription>{commit.user || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Created at</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={commit.creationTime} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem flex={{ default: 'flex_3' }}>
            <DescriptionList
              data-test="commit-details"
              columnModifier={{
                default: '1Col',
              }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <StatusIconWithTextLabel status={commitStatus as runStatus} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Component</DescriptionListTerm>
                <DescriptionListDescription>
                  {commit.components.map((component, index) => {
                    return (
                      <>
                        {component}
                        {index < commit.components.length - 1 && ','}
                      </>
                    );
                  })}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
    </>
  );
};

export default CommitOverviewTab;
