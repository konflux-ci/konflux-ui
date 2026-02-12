import * as React from 'react';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { isResourceEnterpriseContract } from '~/utils/enterprise-contract-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { useTaskRunsForPipelineRuns } from '../../hooks/useTaskRunsV2';
import { commonFetchJSON, getK8sResourceURL } from '../../k8s';
import { PodModel } from '../../models/pod';
import { useNamespace } from '../../shared/providers/Namespace';
import { getPipelineRunFromTaskRunOwnerRef } from '../../utils/common-utils';
import { getTaskRunLog } from '../../utils/tekton-results';
import {
  ComponentEnterpriseContractResult,
  EnterpriseContractResult,
  ENTERPRISE_CONTRACT_STATUS,
  UIEnterpriseContractData,
} from './types';
import { extractEcResultsFromTaskRunLogs } from './utils';

export const useEnterpriseContractResultFromLogs = (
  pipelineRunName: string,
): [ComponentEnterpriseContractResult[], boolean, unknown] => {
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
  const [ecJson, setEcJson] = React.useState<EnterpriseContractResult>();
  const [ecLoaded, setEcLoaded] = React.useState<boolean>(false);
  const [taskRun] = taskRuns ?? [];
  const podName = taskRunLoaded && !taskRunError ? taskRun?.status?.podName : null;
  const ecResultOpts = React.useMemo(() => {
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
    if (taskRunLoaded && securityTaskRunName && !ecResultOpts) {
      setFetchTknLogs(true);
      return;
    }
    if (ecResultOpts) {
      commonFetchJSON(getK8sResourceURL(PodModel, undefined, ecResultOpts))
        .then((res: EnterpriseContractResult) => {
          if (unmount) return;
          setEcJson(res);
          setEcLoaded(true);
        })
        .catch((err) => {
          if (unmount) return;
          if (err.code === 404) {
            setFetchTknLogs(true);
          } else {
            setEcLoaded(true);
          }
          // eslint-disable-next-line no-console
          console.warn('Error while fetching Enterprise Contract result from logs', err);
        });
    }
    return () => {
      unmount = true;
    };
  }, [ecResultOpts, taskRunLoaded, securityTaskRunName]);

  React.useEffect(() => {
    let unmount = false;
    if (fetchTknLogs && !ecLoaded && taskRun) {
      const fetch = async () => {
        try {
          const pid = getPipelineRunFromTaskRunOwnerRef(taskRun)?.uid;
          const logs = await getTaskRunLog(taskRun.metadata.namespace, taskRun.metadata.uid, pid);
          if (unmount) return;
          const json = extractEcResultsFromTaskRunLogs(logs);
          setEcJson(json);
          setEcLoaded(true);
        } catch (e) {
          if (unmount) return;
          setEcLoaded(true);
          // eslint-disable-next-line no-console
          console.warn(
            'Error while fetching Enterprise Contract result from tekton results logs',
            e,
          );
        }
      };

      void fetch();
    }
    return () => {
      unmount = true;
    };
  }, [ecLoaded, fetchTknLogs, taskRun]);

  const ecResult = React.useMemo(() => {
    // filter out components for which ec didn't execute because invalid image URL
    return ecLoaded && ecJson
      ? ecJson.components?.filter((comp: ComponentEnterpriseContractResult) => {
          return !(
            comp.violations &&
            comp.violations?.length === 1 &&
            !comp.violations[0].metadata &&
            comp.violations[0].msg.includes('404 Not Found')
          );
        })
      : undefined;
  }, [ecJson, ecLoaded]);

  const error = pipelineRunError ?? taskRunError;

  return [ecResult, error ? true : ecLoaded, error];
};

export const mapEnterpriseContractResultData = (
  ecResult: ComponentEnterpriseContractResult[],
): UIEnterpriseContractData[] => {
  return ecResult.reduce((acc, compResult) => {
    compResult?.violations?.forEach((v) => {
      const rule: UIEnterpriseContractData = {
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: ENTERPRISE_CONTRACT_STATUS.violations,
        timestamp: v.metadata?.effective_on,
        component: compResult.name,
        msg: v.msg,
        collection: v.metadata?.collections,
        solution: v.metadata?.solution,
      };
      acc.push(rule);
    });
    compResult?.warnings?.forEach((v) => {
      const rule: UIEnterpriseContractData = {
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: ENTERPRISE_CONTRACT_STATUS.warnings,
        timestamp: v.metadata?.effective_on,
        component: compResult.name,
        msg: v.msg,
        collection: v.metadata?.collections,
      };
      acc.push(rule);
    });
    compResult?.successes?.forEach((v) => {
      const rule: UIEnterpriseContractData = {
        title: v.metadata?.title,
        description: v.metadata?.description,
        status: ENTERPRISE_CONTRACT_STATUS.successes,
        component: compResult.name,
        collection: v.metadata?.collections,
      };
      acc.push(rule);
    });

    return acc;
  }, []);
};

export const useEnterpriseContractResults = (
  pipelineRunName: string,
): [UIEnterpriseContractData[], boolean, unknown] => {
  const [ec, ecLoaded, ecError] = useEnterpriseContractResultFromLogs(pipelineRunName);
  const ecResult = React.useMemo(() => {
    return ecLoaded && ec && !ecError ? mapEnterpriseContractResultData(ec) : undefined;
  }, [ec, ecLoaded, ecError]);

  return [ecResult, ecLoaded, ecError];
};
