import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { PIPELINE_RUNS_VULNERABILITIES_PATH } from '~/routes/paths';
import { Action } from '~/shared/components/action-menu/types';
import { LazyActionHookResult, useLazyActionMenu } from '~/shared/hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunKind } from '~/types';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';

const VIEW_VULNERABILITIES_ACTION_ID = 'view-vulnerabilities';
const VIEW_VULNERABILITIES_ACTION_LABEL = 'View vulnerabilities';

export const useViewVulnerabilitiesActionLazy = (
  pipelineRun: PipelineRunKind,
): LazyActionHookResult<Action> => {
  const navigate = useNavigate();
  const namespace = useNamespace();
  const labels = pipelineRun?.metadata?.labels ?? {};
  const applicationName = labels[PipelineRunLabel.APPLICATION];
  const pipelineRunName = pipelineRun?.metadata?.name;
  const isCompletedBuild =
    labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD &&
    pipelineRun?.status?.completionTime !== undefined;
  const hasRoxctlScan = isTaskRunInPipelineRun(pipelineRun, ROXCTL_SCAN_TASK);

  const buildActions = React.useCallback((): Action[] => {
    if (!isCompletedBuild || !hasRoxctlScan || !applicationName || !pipelineRunName) {
      return [];
    }

    return [
      {
        id: VIEW_VULNERABILITIES_ACTION_ID,
        label: VIEW_VULNERABILITIES_ACTION_LABEL,
        cta: () =>
          navigate(
            PIPELINE_RUNS_VULNERABILITIES_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              pipelineRunName,
            }),
          ),
      },
    ];
  }, [applicationName, hasRoxctlScan, isCompletedBuild, namespace, navigate, pipelineRunName]);

  return useLazyActionMenu({ buildActions });
};
