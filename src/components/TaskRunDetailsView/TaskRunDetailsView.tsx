import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { getErrorState } from '~/shared/utils/error-utils';
import { TektonResourceLabel } from '~/types';
import { downloadTaskRunYaml } from '~/utils/common-utils';
import { taskRunStatus } from '~/utils/pipeline-utils';
import { FeatureFlagIndicator } from '../../feature-flags/FeatureFlagIndicator';
import { useTaskRunV2 } from '../../hooks/useTaskRunsV2';
import {
  PIPELINERUN_DETAILS_PATH,
  PIPELINERUN_LIST_PATH,
  PIPELINERUN_TASK_LIST,
  TASKRUN_DETAILS_PATH,
} from '../../routes/paths';
import { useNamespace } from '../../shared/providers/Namespace';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { DetailsPage } from '../DetailsPage';
import { isResourceEnterpriseContract } from '../EnterpriseContract/utils';
import { StatusIconWithTextLabel } from '../topology/StatusIcon';

export const TaskRunDetailsView: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const params = useParams();
  const navigate = useNavigate();
  const [taskRun, loaded, error] = useTaskRunV2(namespace, taskRunName);

  const trStatus = React.useMemo(
    () => loaded && taskRun && taskRunStatus(taskRun),
    [loaded, taskRun],
  );
  const applicationName = taskRun?.metadata?.labels?.[PipelineRunLabel.APPLICATION];
  const baseURL = TASKRUN_DETAILS_PATH.createPath({
    applicationName,
    workspaceName: namespace,
    taskRunName,
  });
  const { activeTab } = params;

  React.useEffect(() => {
    if (!activeTab && trStatus) {
      trStatus === runStatus.Succeeded ? navigate(`${baseURL}`) : navigate(`${baseURL}/logs`);
    }
  }, [activeTab, baseURL, navigate, trStatus]);

  if (error) {
    return getErrorState(error, loaded, 'task run');
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const plrName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];
  const isEnterpriseContract = isResourceEnterpriseContract(taskRun);

  return (
    <DetailsPage
      headTitle={taskRunName}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: PIPELINERUN_LIST_PATH.createPath({ applicationName, workspaceName: namespace }),
          name: 'Pipeline runs',
        },
        {
          path: PIPELINERUN_DETAILS_PATH.createPath({
            applicationName,
            workspaceName: namespace,
            pipelineRunName: plrName,
          }),
          name: plrName,
        },
        {
          path: PIPELINERUN_TASK_LIST.createPath({
            applicationName,
            workspaceName: namespace,
            pipelineRunName: plrName,
          }),
          name: `Task runs`,
        },
        {
          path: TASKRUN_DETAILS_PATH.createPath({
            applicationName,
            workspaceName: namespace,
            taskRunName,
          }),
          name: taskRunName,
        },
      ]}
      title={
        <>
          <FeatureFlagIndicator flags={['taskruns-kubearchive']} />
          <span className="pf-v5-u-mr-sm">{taskRunName}</span>
          <StatusIconWithTextLabel status={trStatus} />
        </>
      }
      actions={[
        {
          key: 'download-task-run-yaml',
          label: 'Download Task Run YAML',
          onClick: () => downloadTaskRunYaml(taskRun),
        },
      ]}
      baseURL={baseURL}
      tabs={[
        {
          key: 'index',
          label: 'Details',
        },
        {
          key: 'logs',
          label: 'Logs',
          isFilled: true,
        },
        ...(isEnterpriseContract
          ? [
              {
                key: 'security',
                label: 'Security',
              },
            ]
          : []),
      ]}
    />
  );
};

export default TaskRunDetailsView;
