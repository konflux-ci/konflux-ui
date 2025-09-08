import * as React from 'react';
import { Label, Truncate, Flex, FlexItem } from '@patternfly/react-core';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { ExternalLink } from '../..';
import { PipelineRunEventType } from '../../../consts/pipelinerun';

export interface TriggerColumnData {
  repoOrg?: string;
  repoName?: string;
  repoURL?: string;
  prNumber?: string;
  eventType?: string;
  commitSha?: string;
  shaUrl?: string;
}

/**
 * Component that renders trigger column data with appropriate icons and links
 * @param props - Object containing trigger-related data
 * @returns JSX element for the trigger column
 */
export const TriggerColumnData: React.FC<TriggerColumnData> = ({
  repoOrg,
  repoURL,
  prNumber,
  eventType,
  commitSha,
  shaUrl,
  repoName,
}) => {
  if (!eventType || !commitSha) {
    return <>-</>;
  }

  const commitShaText = commitSha.substring(0, 7);
  const isPullRequest = eventType === PipelineRunEventType.PULL;
  const icon = <CommitIcon isPR={isPullRequest} className="sha-title-icon" />;
  const pullRequestText = `${repoOrg}/${repoName}/${prNumber}`;
  const pullRequestURL = `${repoURL}/pull/${prNumber}`;

  return (
    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      {isPullRequest && (
        <FlexItem>
          <ExternalLink
            href={pullRequestURL}
            text={<Truncate content={pullRequestText} />}
            hideIcon={true}
          />
        </FlexItem>
      )}
      <FlexItem>
        <Label color="blue" isCompact>
          <ExternalLink href={shaUrl} text={commitShaText} />
        </Label>
      </FlexItem>
    </Flex>
  );
};
