import * as React from 'react';
import { Label, Truncate, Flex, FlexItem } from '@patternfly/react-core';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { PipelineRunEventType } from '~/consts/pipelinerun';
import { ExternalLink } from '~/shared';
import type { TriggerColumnData as TriggerColumnDataProps } from '~/shared/components/trigger-column-data/trigger-column-data';

/**
 * Reference column renderer for the dynamic pipeline run list row.
 * Uses flex layout with shrinkable PR-link item so the content stays within
 * the cell bounds when the Reference td has overflow:hidden applied.
 * Only used in DynamicPipelineRunListRow – other row variants continue to
 * use the shared TriggerColumnData component.
 */
export const PipelineRunReferenceCell: React.FC<TriggerColumnDataProps> = ({
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
      <FlexItem flex={{ default: 'flexNone' }}>{icon}</FlexItem>
      {isPullRequest && (
        <FlexItem
          flex={{ default: 'flex_1' }}
          shrink={{ default: 'shrink' }}
          style={{ minWidth: 0 }}
        >
          <ExternalLink
            href={pullRequestURL}
            text={<Truncate content={pullRequestText} />}
            hideIcon={true}
          />
        </FlexItem>
      )}
      <FlexItem flex={{ default: 'flexNone' }}>
        <Label color="blue" isCompact>
          <ExternalLink href={shaUrl} text={commitShaText} />
        </Label>
      </FlexItem>
    </Flex>
  );
};
