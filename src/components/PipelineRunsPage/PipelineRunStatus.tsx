import * as React from 'react';
import { Flex } from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useKueueQueuePositionForPipelineRun } from '~/kueue/kueue-hooks';
import {
  getKueueQueuePositionLabel,
  getKueueQueueWaitTooltip,
  isKueueQueueWaitVisible,
} from '~/kueue/kueue-utils';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunKind } from '~/types';
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
    const { status, message, label } = PLRStatus.useStatusDisplay(plr);

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
    // Single gate for all Kueue queue info (flag + queue label + derived `Queued`).
    const showQueueInfo = isKueueQueueWaitVisible(plr, isFlagOn);
    const now = useCurrentTime(showQueueInfo);
    const createdAt = plr.metadata?.creationTimestamp;

    const queuePositionLabel = showQueueInfo
      ? getKueueQueuePositionLabel(queuePosition)
      : undefined;

    // Two-line cell: the status word with the queue position underneath. Left undefined for other
    // statuses so the component keeps its single-line DOM.
    const statusText = queuePositionLabel ? (
      <Flex
        component="span"
        direction={{ default: 'column' }}
        alignItems={{ default: 'alignItemsFlexStart' }}
        gap={{ default: 'gapNone' }}
      >
        <span>{label}</span>
        <span>{queuePositionLabel}</span>
      </Flex>
    ) : undefined;

    const queuedTooltip = showQueueInfo ? getKueueQueueWaitTooltip(createdAt, now) : undefined;

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
    return <PLRStatus.StatusIconWithText status={status} tooltip={tooltip} text={statusText} />;
  },
);

PipelineRunStatus.displayName = 'PipelineRunStatus';

export default PipelineRunStatus;
