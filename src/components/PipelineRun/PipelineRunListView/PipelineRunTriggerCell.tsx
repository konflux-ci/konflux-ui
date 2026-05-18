import * as React from 'react';
import { TriggerColumnData } from '~/shared/components/trigger-column-data/trigger-column-data';
import { Commit } from '~/types';

import './PipelineRunTriggerCell.scss';

/** Display labels for pipeline-as-code event types on the pipeline run list. */
export enum PipelineRunEventTypeLabel {
  push = 'Push',
  pull_request = 'Pull Request',
  incoming = 'Incoming',
  'retest-all-comment' = 'Retest All Comment',
}

type PipelineRunTriggerCellProps = {
  commit: Commit | null;
};

export const PipelineRunTriggerCell: React.FC<PipelineRunTriggerCellProps> = ({ commit }) => {
  const eventLabel = commit?.eventType
    ? PipelineRunEventTypeLabel[commit.eventType] ?? commit.eventType
    : '-';

  return (
    <div className="pipeline-run-trigger-cell">
      <div className="pipeline-run-trigger-cell__event">{eventLabel}</div>
      <TriggerColumnData
        repoOrg={commit?.repoOrg}
        repoName={commit?.repoName}
        repoURL={commit?.repoURL}
        prNumber={commit?.pullRequestNumber}
        eventType={commit?.eventType}
        commitSha={commit?.sha}
        shaUrl={commit?.shaURL}
      />
    </div>
  );
};
