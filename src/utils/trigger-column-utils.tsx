import * as React from 'react';
import { Label, Truncate, Flex, FlexItem } from '@patternfly/react-core';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { PipelineRunEventType } from '../consts/pipelinerun';
import { ExternalLink } from '../shared';

export interface TriggerColumnData {
  gitProvider?: string;
  repoOrg?: string;
  repoURL?: string;
  prNumber?: string;
  eventType?: string;
  commitId?: string;
}

/**
 * Component that renders trigger column data with appropriate icons and links
 * @param props - Object containing trigger-related data
 * @returns JSX element for the trigger column
 */
export const TriggerColumnData: React.FC<TriggerColumnData> = ({
  gitProvider,
  repoOrg,
  repoURL,
  prNumber,
  eventType,
  commitId,
}) => {
  if (!eventType || !commitId) {
    return <>-</>;
  }

  const link = `https://${gitProvider}.com/${repoOrg}/${repoURL}`;
  const commitDetails = {
    text: commitId?.substring(0, 7),
    link: `${link}/commit/${commitId}`,
  };

  const isPullRequest = eventType === PipelineRunEventType.PULL;
  const icon = <CommitIcon isPR={isPullRequest} className="sha-title-icon" />;
  const pullRequestText = `${repoOrg}/${repoURL}/${prNumber}`;
  const pullRequestLink = `${link}/pull/${prNumber}`;

  return (
    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      {isPullRequest && (
        <FlexItem>
          <ExternalLink
            href={pullRequestLink}
            text={<Truncate content={pullRequestText} />}
            hideIcon={true}
          />
        </FlexItem>
      )}
      <FlexItem>
        <Label color="blue" isCompact>
          <ExternalLink href={commitDetails.link} text={commitDetails.text} />
        </Label>
      </FlexItem>
    </Flex>
  );
};

/**
 * @deprecated Use TriggerColumnData component instead
 * Legacy function for backward compatibility
 */
export const getTriggerColumnData = (data: TriggerColumnData): React.ReactNode => {
  return <TriggerColumnData {...data} />;
};
