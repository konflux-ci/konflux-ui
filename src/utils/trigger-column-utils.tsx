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
 * Renders the trigger column data with appropriate icons and links
 * @param data - Object containing trigger-related data
 * @returns JSX element for the trigger column
 */
export const getTriggerColumnData = (data: TriggerColumnData): React.ReactNode => {
  const { gitProvider, repoOrg, repoURL, prNumber, eventType, commitId } = data;

  if (!eventType || !commitId) {
    return '-';
  }

  let icon = null;
  let text = '';
  let link = `https://${gitProvider}.com/${repoOrg}/${repoURL}`;

  const commitDetails = {
    text: commitId?.substring(0, 7),
    link: `${link}/commit/${commitId}`,
  };

  if (eventType === PipelineRunEventType.PUSH || eventType === PipelineRunEventType.RETEST) {
    icon = <CommitIcon isPR={false} className="sha-title-icon" />;
  } else if (eventType === PipelineRunEventType.PULL) {
    icon = <CommitIcon isPR={true} className="sha-title-icon" />;
    text = `${repoOrg}/${repoURL}/${prNumber}`;
    link = `${link}/pull/${prNumber}`;
  }

  return (
    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      {eventType === PipelineRunEventType.PULL && (
        <FlexItem>
          <ExternalLink href={link} text={<Truncate content={text} />} hideIcon={true} />
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
