import * as React from 'react';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { ComponentConformaResult, ConformaResult, UIConformaData } from '~/types/conforma';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { useTaskRunsForPipelineRuns } from '../../hooks/useTaskRunsV2';
import { useNamespace } from '../../shared/providers/Namespace';
import {
  mapConformaResultData,
  resolveConformaResultFromTaskRun,
} from './ConformaResultsTab/conforma-fetchers';

export { mapConformaResultData };

export const useConformaResultFromLogs = (
  pipelineRunName: string,
): [ComponentConformaResult[], boolean, unknown] => {
  const namespace = useNamespace();
  const isKubearchiveEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] = usePipelineRunV2(
    namespace,
    pipelineRunName,
  );
  const securityTaskRunName = React.useMemo(() => {
    if (!pipelineRunLoaded || pipelineRunError) {
      return undefined;
    }

    if (isResourceEnterpriseContract(pipelineRun)) {
      return EC_TASK;
    }

    if (isTaskRunInPipelineRun(pipelineRun, CONFORMA_TASK)) {
      return CONFORMA_TASK;
    }

    return undefined;
  }, [pipelineRun, pipelineRunLoaded, pipelineRunError]);
  const [taskRuns, taskRunLoaded, taskRunError] = useTaskRunsForPipelineRuns(
    securityTaskRunName ? namespace : undefined,
    pipelineRunName,
    securityTaskRunName,
  );
  const [crJson, setCrJson] = React.useState<ConformaResult | undefined>();
  const [crLoaded, setCrLoaded] = React.useState<boolean>(false);
  const [taskRun] = taskRuns ?? [];

  // Keep a ref to the latest taskRun so the effect body always reads the
  // current value without adding the (potentially unstable) object reference
  // to the dep array. A stable primitive derived from the task run is used as
  // the dep instead: prefer uid when available, fall back to podName so that
  // task runs without metadata (e.g. some test/edge-case runs) are still served.
  const taskRunRef = React.useRef(taskRun);
  taskRunRef.current = taskRun;
  const taskRunId = taskRun?.metadata?.uid ?? taskRun?.status?.podName;

  React.useEffect(() => {
    if (!taskRunLoaded || !securityTaskRunName || !taskRunId) return;

    const currentTaskRun = taskRunRef.current;
    if (!currentTaskRun) return;

    let cancelled = false;
    resolveConformaResultFromTaskRun(namespace, currentTaskRun, isKubearchiveEnabled)
      .then((result) => {
        if (!cancelled) {
          setCrJson(result);
          setCrLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setCrLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [taskRunLoaded, taskRunId, securityTaskRunName, namespace, isKubearchiveEnabled]);

  const conformaResult = React.useMemo(() => {
    // filter out components for which Conforma didn't execute because invalid image URL
    return crLoaded && crJson
      ? crJson.components?.filter((comp: ComponentConformaResult) => {
          return !(
            comp.violations &&
            comp.violations?.length === 1 &&
            !comp.violations[0].metadata &&
            comp.violations[0].msg.includes('404 Not Found')
          );
        })
      : undefined;
  }, [crJson, crLoaded]);

  const error = pipelineRunError ?? taskRunError;

  return [conformaResult, error ? true : crLoaded, error];
};

export const useConformaResult = (
  pipelineRunName: string,
): [UIConformaData[], boolean, unknown] => {
  const [cr, crLoaded, crError] = useConformaResultFromLogs(pipelineRunName);
  const conformaResult = React.useMemo(() => {
    return crLoaded && cr && !crError ? mapConformaResultData(cr) : undefined;
  }, [cr, crLoaded, crError]);

  return [conformaResult, crLoaded, crError];
};
