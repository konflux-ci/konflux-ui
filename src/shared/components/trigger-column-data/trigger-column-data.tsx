import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { PipelineRunEventType } from '~/consts/pipelinerun';
import { ExternalLink } from '../..';

import './trigger-column-data.scss';

/** Max characters shown for org/repo/pr in the trigger column PR link. */
const PR_LINK_LABEL_MAX_LENGTH = 20;

const truncateEnd = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
};

export interface TriggerColumnDataProps {
  repoOrg?: string;
  repoName?: string;
  repoURL?: string;
  prNumber?: string;
  eventType?: string;
  commitSha?: string;
  shaUrl?: string;
}

const ShaLink: React.FC<{ shaUrl?: string; commitShaText: string }> = ({
  shaUrl,
  commitShaText,
}) => (
  <Label color="blue" isCompact className="trigger-column-data__sha-label">
    <ExternalLink href={shaUrl} text={commitShaText} />
  </Label>
);

/**
 * Trigger reference links: icon + commit SHA on one row; when a PR link is shown,
 * PR stays on the first row and the SHA moves to a second row to avoid overlapping the kebab column.
 */
export const TriggerColumnData: React.FC<TriggerColumnDataProps> = ({
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
  const hasPrLink = isPullRequest && Boolean(repoURL && prNumber);
  const pullRequestText = `${repoOrg}/${repoName}/${prNumber}`;
  const pullRequestURL = `${repoURL}/pull/${prNumber}`;
  const pullRequestDisplayText = truncateEnd(pullRequestText, PR_LINK_LABEL_MAX_LENGTH);

  if (hasPrLink) {
    return (
      <span className="trigger-column-data trigger-column-data--with-pr">
        <span className="trigger-column-data__row">
          <CommitIcon isPR className="trigger-column-data__icon sha-title-icon" />
          <span className="trigger-column-data__pr-link-wrap" title={pullRequestText}>
            <ExternalLink
              additionalClassName="trigger-column-data__pr-link"
              href={pullRequestURL}
              text={pullRequestDisplayText}
              hideIcon={true}
            />
          </span>
        </span>
        <span className="trigger-column-data__row trigger-column-data__row--sha">
          <ShaLink shaUrl={shaUrl} commitShaText={commitShaText} />
        </span>
      </span>
    );
  }

  return (
    <span className="trigger-column-data">
      <CommitIcon isPR={isPullRequest} className="trigger-column-data__icon sha-title-icon" />
      <ShaLink shaUrl={shaUrl} commitShaText={commitShaText} />
    </span>
  );
};
