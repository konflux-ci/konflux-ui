import * as React from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Skeleton,
} from '@patternfly/react-core';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { KUEUE_PRIORITY_CLASS_LABEL } from '~/kueue/const';
import { useKueueQueuePositionForPipelineRun } from '~/kueue/kueue-hooks';
import { isKueueQueueWaitVisible } from '~/kueue/kueue-utils';
import { HelpTooltipIcon } from '~/shared';
import Duration from '~/shared/components/duration/Duration';
import { useNamespace } from '~/shared/providers/Namespace';
import type { PipelineRunKind } from '~/types';

const PRIORITY_HELP_TEXT =
  'Priority classes are set by your cluster admin. Higher values are scheduled first.';

type Props = {
  pipelineRun: PipelineRunKind;
};

/**
 * Queue position, queue priority, and "Waiting for" rows for a Kueue-queued PipelineRun.
 * Renders nothing unless `isKueueQueueWaitVisible` passes, so the rows leave together
 * when the run leaves the queue. Does not change the status word shown elsewhere.
 */
export const PipelineRunQueueDetails: React.FC<Props> = ({ pipelineRun }) => {
  const namespace = useNamespace();
  const isFlagOn = useIsOnFeatureFlag('kueue-queue-position');
  const { queuePosition, isLoading, error, hasPayload } = useKueueQueuePositionForPipelineRun(
    namespace,
    pipelineRun,
  );

  if (!isKueueQueueWaitVisible(pipelineRun, isFlagOn)) return null;

  const className = pipelineRun.metadata?.labels?.[KUEUE_PRIORITY_CLASS_LABEL];

  // Value shown when there is no position/priority number to render. A later failed poll
  // keeps the last payload (TanStack Query retains `data`), so `hasPayload` wins over `error`.
  let fallback: React.ReactNode;
  if (isLoading && !hasPayload) {
    fallback = <Skeleton width="3rem" screenreaderText="Loading" />;
  } else if (error && !hasPayload) {
    fallback = 'N/A';
  } else {
    fallback = '-';
  }

  // positionInClusterQueue is 0-based; the head of the queue is 1.
  const position = queuePosition ? String(queuePosition.positionInClusterQueue + 1) : fallback;

  const priorityNumber =
    typeof queuePosition?.priority === 'number' ? queuePosition.priority : undefined;
  let priority: React.ReactNode;
  if (className) {
    priority = priorityNumber !== undefined ? `${className} (${priorityNumber})` : className;
  } else {
    priority = priorityNumber !== undefined ? String(priorityNumber) : fallback;
  }

  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>Queue position</DescriptionListTerm>
        <DescriptionListDescription data-test="queue-position">
          {position}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          Queue priority
          <span className="pf-v6-u-ml-xs" data-test="queue-priority-help">
            <HelpTooltipIcon content={PRIORITY_HELP_TEXT} />
          </span>
        </DescriptionListTerm>
        <DescriptionListDescription data-test="queue-priority">
          {priority}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Waiting for</DescriptionListTerm>
        <DescriptionListDescription>
          <Duration startTime={pipelineRun.metadata?.creationTimestamp} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};

export default PipelineRunQueueDetails;
