import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { Action } from '~/shared/components/action-menu/types';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunKind } from '~/types';
import { getPipelineRunVulnerabilitiesPath } from '~/utils/pipeline-run-routes';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';

const VIEW_VULNERABILITIES_ACTION_ID = 'view-vulnerabilities';
const VIEW_VULNERABILITIES_ACTION_LABEL = 'View vulnerabilities';

export const useViewVulnerabilitiesAction = (pipelineRun: PipelineRunKind): Action[] => {
  const navigate = useNavigate();
  const namespace = useNamespace();
  const labels = pipelineRun?.metadata?.labels ?? {};
  const pipelineRunName = pipelineRun?.metadata?.name;
  const isCompletedBuild =
    labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD &&
    pipelineRun?.status?.completionTime !== undefined;
  const hasRoxctlScan = isTaskRunInPipelineRun(pipelineRun, ROXCTL_SCAN_TASK);

  return React.useMemo(() => {
    if (!isCompletedBuild || !hasRoxctlScan || !pipelineRunName) {
      return [];
    }

    const vulnerabilitiesPath = getPipelineRunVulnerabilitiesPath(pipelineRun, namespace);

    return [
      {
        id: VIEW_VULNERABILITIES_ACTION_ID,
        label: VIEW_VULNERABILITIES_ACTION_LABEL,
        cta: () => navigate(vulnerabilitiesPath),
      },
    ];
  }, [hasRoxctlScan, isCompletedBuild, namespace, navigate, pipelineRun, pipelineRunName]);
};
