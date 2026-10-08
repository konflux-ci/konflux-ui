import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { DetailsPage } from '~/components/DetailsPage';
import { StatusIconWithTextLabel } from '~/components/StatusIcon/StatusIcon';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { NAMESPACE_TASK_RUN_DETAILS_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { TektonResourceLabel } from '~/types';
import { downloadYamlAction } from '~/utils/common-utils';
import {
  getPipelineRunBreadcrumbs,
  getPipelineRunDetailsPath,
  getTaskRunDetailsPath,
} from '~/utils/pipeline-run-routes';
import { getDisplayNameFromChildReferences, taskRunStatus } from '~/utils/pipeline-utils';

const NamespaceTaskRunDetailsView = () => {
  const { pipelineRunName, taskRunName } = useParams();
  const namespace = useNamespace();
  const location = useLocation();
  const [task, loaded, error] = useTaskRunV2(namespace, taskRunName);
  const [parent, parentLoaded] = usePipelineRunV2(namespace, pipelineRunName);
  const status = task && loaded && !error ? taskRunStatus(task) : null;
  useStatusOnFavicon(status);
  if (!loaded || !parentLoaded)
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'task run');
  const actualParent =
    task?.metadata.labels?.[TektonResourceLabel.pipelinerun] ||
    task?.metadata.ownerReferences?.find((owner) => owner.kind === 'PipelineRun')?.name;
  if (!task || actualParent !== pipelineRunName)
    return getErrorState({ code: 404 }, true, 'task run');

  const baseURL = NAMESPACE_TASK_RUN_DETAILS_PATH.createPath({
    workspaceName: namespace,
    pipelineRunName,
    taskRunName,
  });
  if ((parent ?? task).metadata.labels?.[PipelineRunLabel.APPLICATION]) {
    return (
      <Navigate
        replace
        to={`${getTaskRunDetailsPath(task, namespace, parent)}${location.pathname.slice(baseURL.length)}${location.search}${location.hash}`}
      />
    );
  }
  const parentCrumbs = parent && getPipelineRunBreadcrumbs(parent);
  const breadcrumbs = parentCrumbs && [
    ...parentCrumbs,
    { name: 'Task runs', path: `${getPipelineRunDetailsPath(parent)}/taskruns` },
    { name: taskRunName, path: baseURL },
  ];
  const displayName = getDisplayNameFromChildReferences(parent, taskRunName);
  return (
    <DetailsPage
      headTitle={taskRunName}
      title={
        <>
          <span className="pf-v6-u-mr-sm">
            {taskRunName}
            {displayName ? ` (${displayName})` : ''}
          </span>
          <StatusIconWithTextLabel status={status} />
        </>
      }
      breadcrumbs={breadcrumbs}
      baseURL={baseURL}
      featureFlags={['taskruns-kubearchive']}
      actions={[{ key: 'download', label: 'Download YAML', onClick: downloadYamlAction(task).cta }]}
      tabs={[
        { key: 'index', label: 'Details' },
        { key: 'logs', label: 'Logs', isFilled: true },
      ]}
    />
  );
};

export default NamespaceTaskRunDetailsView;
