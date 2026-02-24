import * as React from 'react';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import {
  ComponentConformaResult,
  CONFORMA_RESULT_STATUS,
  ConformaResult,
  UIConformaData,
} from '~/types/conforma';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { useTaskRunsForPipelineRuns } from '../../hooks/useTaskRunsV2';
import { commonFetchJSON, getK8sResourceURL } from '../../k8s';
import { PodModel } from '../../models/pod';
import { useNamespace } from '../../shared/providers/Namespace';
import { getPipelineRunFromTaskRunOwnerRef } from '../../utils/common-utils';
import { getTaskRunLog } from '../../utils/tekton-results';
import { extractConformaResultsFromTaskRunLogs } from './utils';

export const useConformaResultFromLogs = (
  pipelineRunName: string,
): [ComponentConformaResult[], boolean, unknown] => {
  const namespace = useNamespace();
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
  const [fetchTknLogs, setFetchTknLogs] = React.useState<boolean>(false);
  const [crJson, setCrJson] = React.useState<ConformaResult>();
  const [crLoaded, setCrLoaded] = React.useState<boolean>(false);
  const [taskRun] = taskRuns ?? [];
  const podName = taskRunLoaded && !taskRunError ? taskRun?.status?.podName : null;
  const crResultOpts = React.useMemo(() => {
    return podName
      ? {
          ns: namespace,
          name: podName,
          path: 'log',
          queryParams: {
            container: 'step-report-json',
            follow: 'true',
          },
        }
      : null;
  }, [podName, namespace]);

  React.useEffect(() => {
    let unmount = false;
    if (taskRunLoaded && securityTaskRunName && !crResultOpts) {
      setFetchTknLogs(true);
      return;
    }
    if (crResultOpts) {
      commonFetchJSON(getK8sResourceURL(PodModel, undefined, crResultOpts))
        .then((res: ConformaResult) => {
          if (unmount) return;
          setCrJson(res);
          setCrLoaded(true);
        })
        .catch((err) => {
          if (unmount) return;
          if (err.code === 404) {
            setFetchTknLogs(true);
          } else {
            setCrLoaded(true);
          }
          // eslint-disable-next-line no-console
          console.warn('Error while fetching Conforma result from logs', err);
        });
    }
    return () => {
      unmount = true;
    };
  }, [crResultOpts, taskRunLoaded, securityTaskRunName]);

  React.useEffect(() => {
    let unmount = false;
    if (fetchTknLogs && !crLoaded && taskRun) {
      const fetch = async () => {
        try {
          const pid = getPipelineRunFromTaskRunOwnerRef(taskRun)?.uid;
          const logs = await getTaskRunLog(taskRun.metadata.namespace, taskRun.metadata.uid, pid);
          if (unmount) return;
          const json = extractConformaResultsFromTaskRunLogs(logs);
          setCrJson(json);
          setCrLoaded(true);
        } catch (e) {
          if (unmount) return;
          setCrLoaded(true);
          // eslint-disable-next-line no-console
          console.warn('Error while fetching Conforma result from tekton results logs', e);
        }
      };

      void fetch();
    }
    return () => {
      unmount = true;
    };
  }, [crLoaded, fetchTknLogs, taskRun]);

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

export const mapConformaResultData = (
  conformaResult: ComponentConformaResult[],
): UIConformaData[] => {
  return conformaResult.reduce((acc, compResult) => {
    compResult?.violations?.forEach((v) => {
      const rule: UIConformaData = {
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: CONFORMA_RESULT_STATUS.violations,
        timestamp: v.metadata?.effective_on,
        component: compResult.name,
        msg: v.msg,
        collection: v.metadata?.collections,
        solution: v.metadata?.solution,
      };
      acc.push(rule);
    });
    compResult?.warnings?.forEach((v) => {
      const rule: UIConformaData = {
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: CONFORMA_RESULT_STATUS.warnings,
        timestamp: v.metadata?.effective_on,
        component: compResult.name,
        msg: v.msg,
        collection: v.metadata?.collections,
      };
      acc.push(rule);
    });
    compResult?.successes?.forEach((v) => {
      const rule: UIConformaData = {
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: CONFORMA_RESULT_STATUS.successes,
        component: compResult.name,
        collection: v.metadata?.collections,
      };
      acc.push(rule);
    });

    return acc;
  }, []);
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
