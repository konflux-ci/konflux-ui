import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useKueueQueuePositionForPipelineRun } from '~/kueue/kueue-hooks';
import { isKueueQueueWaitVisible } from '~/kueue/kueue-utils';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunKind } from '~/types';
import { calculateDuration } from '~/utils/pipeline-utils';
import { PLRStatus } from '~/utils/plr-status-config';
import { getPLRLogSnippet } from '../../shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';

type PipelineRunStatusProps = {
  plr: PipelineRunKind;
  isTooltipVisible?: boolean;
  isLabel?: boolean;
};

const PipelineRunStatus: React.FC<PipelineRunStatusProps> = React.memo(
  ({ plr, isTooltipVisible = true, isLabel = false }) => {
    const namespace = useNamespace();
    const { status, message } = PLRStatus.useStatusDisplay(plr);

    const isFailed = status === runStatus.Failed;
    const shouldFetchTaskRuns = isFailed && isTooltipVisible;

    const [taskRuns, taskRunsLoaded] = useTaskRunsForPipelineRuns(
      shouldFetchTaskRuns ? namespace : null,
      shouldFetchTaskRuns ? (plr.metadata?.name ?? null) : null,
      undefined,
      false,
    );

    // The hook self-disables (flag off, no queue label, or not pending), so it is always called.
    const { queuePosition } = useKueueQueuePositionForPipelineRun(namespace, plr);
    const isFlagOn = useIsOnFeatureFlag('kueue-queue-position');
    const showWait = isKueueQueueWaitVisible(plr, isFlagOn);
    const now = useCurrentTime(showWait);
    const createdAt = plr.metadata?.creationTimestamp;

    // positionInClusterQueue is 0-based; the head of the queue is position#1.
    const queuePositionLabel =
      status === runStatus.Queued && queuePosition
        ? `position#${queuePosition.positionInClusterQueue + 1}`
        : undefined;

    const queuedTooltip =
      status === runStatus.Queued && showWait && createdAt
        ? `Waiting for: ${calculateDuration(createdAt, now)}`
        : undefined;

    const tooltip = React.useMemo(() => {
      if (!isTooltipVisible) return undefined;
      if (!isFailed || !taskRunsLoaded) return message ?? queuedTooltip;
      const logSnippet = getPLRLogSnippet(plr, taskRuns);
      if (!logSnippet) return message;
      const staticMsg = 'staticMessage' in logSnippet ? logSnippet.staticMessage : undefined;
      if (staticMsg) {
        return `${logSnippet.title}\n${staticMsg}`;
      }
      return logSnippet.title;
    }, [isTooltipVisible, isFailed, taskRunsLoaded, plr, taskRuns, message, queuedTooltip]);

    if (!status) return null;

    if (isLabel) {
      return <PLRStatus.StatusIconWithTextLabel status={status} tooltip={tooltip} />;
    }
    return (
      <PLRStatus.StatusIconWithText
        status={status}
        tooltip={tooltip}
        secondaryText={queuePositionLabel}
      />
    );
  },
);

PipelineRunStatus.displayName = 'PipelineRunStatus';

export default PipelineRunStatus;
