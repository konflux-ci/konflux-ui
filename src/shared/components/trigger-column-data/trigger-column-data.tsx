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
    <Flex
      direction={isPullRequest ? { default: 'column' } : { default: 'row' }}
      spaceItems={{ default: 'spaceItemsXs' }}
      alignItems={
        isPullRequest ? { default: 'alignItemsFlexStart' } : { default: 'alignItemsCenter' }
      }
      flexWrap={{ default: 'nowrap' }}
    >
      {isPullRequest ? (
        <FlexItem>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsNone' }}
            flexWrap={{ default: 'nowrap' }}
          >
            <FlexItem flex={{ default: 'flexNone' }}>{icon}</FlexItem>
            <FlexItem flex={{ default: 'flexNone' }}>
              <ExternalLink href={pullRequestURL} hideIcon>
                <Truncate content={pullRequestText} style={{ maxWidth: '15ch' }} />
              </ExternalLink>
            </FlexItem>
          </Flex>
        </FlexItem>
      ) : (
        <FlexItem>{icon}</FlexItem>
      )}
      <FlexItem>
        <Label color="blue" isCompact>
          <ExternalLink href={shaUrl} text={commitShaText} />
        </Label>
      </FlexItem>
    </Flex>
  );
};
