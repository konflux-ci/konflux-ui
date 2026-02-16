import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { CONFORMA_TASK } from '~/consts/security';
import { getErrorState } from '~/shared/utils/error-utils';
import { TektonResourceLabel } from '~/types';
import { downloadYaml } from '~/utils/common-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
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
import { useApplicationBreadcrumbs } from '../Applications/breadcrumbs/breadcrumb-utils';
import { DetailsPage } from '../DetailsPage';
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

  const plrName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];

  if (!loaded || !plrName) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const showSecurityTab =
    isResourceEnterpriseContract(taskRun) ||
    taskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] === CONFORMA_TASK;

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
          label: 'Download YAML',
          onClick: () => downloadYaml(taskRun),
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
        ...(showSecurityTab
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
