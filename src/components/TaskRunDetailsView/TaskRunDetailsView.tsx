import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useTaskRun } from '../../hooks/usePipelineRuns';
import { HttpError } from '../../k8s/error';
import { RouterParams } from '../../routes/utils';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { TektonResourceLabel } from '../../types';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { runStatus, taskRunStatus } from '../../utils/pipeline-utils';
// import { SecurityEnterpriseContractTab } from '../EnterpriseContractView/SecurityEnterpriseContractTab';
// import { isResourceEnterpriseContract } from '../EnterpriseContractView/utils';
import { DetailsPage } from '../DetailsPage';
import { StatusIconWithTextLabel } from '../topology/StatusIcon';
import { useWorkspaceInfo } from '../Workspace/workspace-context';

export const TaskRunDetailsView: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const { namespace, workspace } = useWorkspaceInfo();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const params = useParams();
  const navigate = useNavigate();
  const [taskRun, loaded, error] = useTaskRun(namespace, taskRunName);

  const trStatus = React.useMemo(
    () => loaded && taskRun && taskRunStatus(taskRun),
    [loaded, taskRun],
  );
  const applicationName = taskRun?.metadata?.labels[PipelineRunLabel.APPLICATION];
  const baseURL = `/workspaces/${workspace}/applications/${applicationName}/taskruns/${taskRunName}`;
  const { activeTab } = params;

  React.useEffect(() => {
    if (!activeTab && trStatus) {
      trStatus === runStatus.Succeeded ? navigate(`${baseURL}`) : navigate(`${baseURL}/logs`);
    }
  }, [activeTab, baseURL, navigate, trStatus]);

  if (error) {
    const httpError = HttpError.fromCode((error as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load task run ${taskRunName}`}
        body={httpError.message}
      />
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const plrName = taskRun.metadata?.labels[TektonResourceLabel.pipelinerun];
  // const isEnterpriseContract = isResourceEnterpriseContract(taskRun);

  return (
    <DetailsPage
      headTitle={taskRunName}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: `/workspaces/${workspace}/applications/${applicationName}/activity/pipelineruns`,
          name: 'Pipeline runs',
        },
        {
          path: `/workspaces/${workspace}/applications/${applicationName}/pipelineruns/${plrName}`,
          name: plrName,
        },
        {
          path: `/workspaces/${workspace}/applications/${applicationName}/pipelineruns/${plrName}/taskruns`,
          name: `Task runs`,
        },
        {
          path: `/workspaces/${workspace}/applications/${applicationName}/taskruns/${taskRunName}`,
          name: taskRunName,
        },
      ]}
      title={
        <>
          <span className="pf-v5-u-mr-sm">{taskRunName}</span>
          <StatusIconWithTextLabel status={trStatus} />
        </>
      }
      baseURL={baseURL}
      tabs={[
        {
          key: 'index',
          label: 'Details',
        },
        {
          key: 'logs',
          label: 'Logs',
        },
        // ...(isEnterpriseContract
        //   ? [
        //       {
        //         key: 'security',
        //         label: 'Security',
        //         component: <SecurityEnterpriseContractTab pipelineRun={plrName} />,
        //       },
        //     ]
        //   : []),
      ]}
    />
  );
};

export default TaskRunDetailsView;
