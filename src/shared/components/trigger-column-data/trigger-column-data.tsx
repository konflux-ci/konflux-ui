import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { PipelineRunEventType } from '~/consts/pipelinerun';
import { createPullRequestUrl } from '~/utils/git-utils';
import { ExternalLink } from '../..';

const GITLAB_PROVIDER = 'gitlab';

const isGitLabProvider = (gitProvider?: string): boolean => gitProvider === GITLAB_PROVIDER;

const getPullRequestDisplayText = (prNumber: string, gitProvider?: string): string =>
  isGitLabProvider(gitProvider) ? `!${prNumber}` : `#${prNumber}`;

export interface TriggerColumnData {
  repoURL?: string;
  prNumber?: string;
  eventType?: string;
  commitSha?: string;
  shaUrl?: string;
  gitProvider?: string;
}

export const TriggerColumnData: React.FC<TriggerColumnData> = ({
  repoURL,
  prNumber,
  eventType,
  commitSha,
  shaUrl,
  gitProvider,
}) => {
  if (!eventType || !commitSha) {
    return <>-</>;
  }

  const isPullRequest = eventType === PipelineRunEventType.PULL;
  const icon = <CommitIcon isPR={isPullRequest} className="sha-title-icon" />;
  const pullRequestURL = createPullRequestUrl(repoURL, prNumber);

  return (
    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      {isPullRequest && prNumber && pullRequestURL && (
        <FlexItem>
          <ExternalLink
            href={pullRequestURL}
            text={getPullRequestDisplayText(prNumber, gitProvider)}
            hideIcon={true}
          />
        </FlexItem>
      )}
      <FlexItem>
        <CommitLabel gitProvider={gitProvider ?? ''} sha={commitSha} shaURL={shaUrl ?? ''} />
      </FlexItem>
    </Flex>
  );
};
