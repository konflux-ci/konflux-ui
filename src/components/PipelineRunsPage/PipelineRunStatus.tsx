import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
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
    const { status, message } = PLRStatus.useStatusDisplay(plr);

    const isFailed = status === runStatus.Failed;
    const [taskRuns, taskRunsLoaded] = useTaskRunsForPipelineRuns(
      isFailed ? namespace : null,
      isFailed ? (plr.metadata?.name ?? null) : null,
      undefined,
      false,
    );

    const tooltip = React.useMemo(() => {
      if (!isTooltipVisible) return undefined;
      if (!isFailed || !taskRunsLoaded) return message;
      const logSnippet = getPLRLogSnippet(plr, taskRuns);
      if (!logSnippet) return message;
      const staticMsg = 'staticMessage' in logSnippet ? logSnippet.staticMessage : undefined;
      if (staticMsg) {
        return `${logSnippet.title}\n${staticMsg}`;
      }
      return logSnippet.title;
    }, [isTooltipVisible, isFailed, taskRunsLoaded, plr, taskRuns, message]);

    if (!status) return null;

    if (isLabel) {
      return <PLRStatus.StatusIconWithTextLabel status={status} tooltip={tooltip} />;
    }
    return <PLRStatus.StatusIconWithText status={status} tooltip={tooltip} />;
  },
);

PipelineRunStatus.displayName = 'PipelineRunStatus';

export default PipelineRunStatus;
