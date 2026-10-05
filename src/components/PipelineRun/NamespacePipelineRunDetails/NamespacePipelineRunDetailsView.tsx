import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { DetailsPage } from '~/components/DetailsPage';
import { usePipelinererunAction } from '~/components/PipelineRun/PipelineRunListView/pipelinerun-actions';
import { StatusIconWithTextLabel } from '~/components/topology/StatusIcon';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
import { PipelineRunModel } from '~/models';
import { NAMESPACE_PIPELINE_RUN_DETAILS_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { downloadYamlAction } from '~/utils/common-utils';
import { pipelineRunCancel, pipelineRunStop } from '~/utils/pipeline-actions';
import { getPipelineRunBreadcrumbs, getPipelineRunDetailsPath } from '~/utils/pipeline-run-routes';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { useAccessReviewForModel } from '~/utils/rbac';

const NamespacePipelineRunDetailsView = () => {
  const { pipelineRunName } = useParams();
  const namespace = useNamespace();
  const location = useLocation();
  const [run, loaded, error] = usePipelineRunV2(namespace, pipelineRunName);
  const baseURL = NAMESPACE_PIPELINE_RUN_DETAILS_PATH.createPath({
    workspaceName: namespace,
    pipelineRunName,
  });
  const breadcrumbs = run ? getPipelineRunBreadcrumbs(run) : undefined;
  const rerun = usePipelinererunAction(run, breadcrumbs?.[2]?.path ?? baseURL);
  const [canPatch] = useAccessReviewForModel(PipelineRunModel, 'patch');
  const status = loaded && run && !error ? pipelineRunStatus(run) : null;
  useStatusOnFavicon(status);

  if (!loaded)
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'pipeline run');
  if (!run) return getErrorState({ code: 404 }, true, 'pipeline run');
  if (run.metadata.labels?.[PipelineRunLabel.APPLICATION]) {
    return (
      <Navigate
        replace
        to={`${getPipelineRunDetailsPath(run)}${location.pathname.slice(baseURL.length)}${location.search}${location.hash}`}
      />
    );
  }

  return (
    <DetailsPage
      headTitle={run.metadata.name}
      title={
        <>
          <span className="pf-v6-u-mr-sm">{run.metadata.name}</span>
          <StatusIconWithTextLabel status={status} />
        </>
      }
      breadcrumbs={breadcrumbs}
      featureFlags={['pipelineruns-kubearchive', 'taskruns-kubearchive']}
      baseURL={baseURL}
      tabs={[
        { key: 'index', label: 'Details', isFilled: true },
        { key: 'taskruns', label: 'Task runs' },
        { key: 'logs', label: 'Logs', isFilled: true },
      ]}
      actions={[
        {
          key: rerun.key,
          label: rerun.label,
          isDisabled: rerun.isDisabled,
          disabledTooltip: rerun.disabledTooltip,
          onClick: rerun.cta,
        },
        {
          key: 'stop',
          label: 'Stop',
          isDisabled: status !== runStatus.Running || !canPatch,
          disabledTooltip: !canPatch ? "You don't have access to stop a build" : undefined,
          onClick: () => pipelineRunStop(run),
        },
        {
          key: 'cancel',
          label: 'Cancel',
          isDisabled: status !== runStatus.Running || !canPatch,
          disabledTooltip: !canPatch ? "You don't have access to cancel a build" : undefined,
          onClick: () => pipelineRunCancel(run),
        },
        { key: 'download', label: 'Download YAML', onClick: downloadYamlAction(run).cta },
      ]}
    />
  );
};

export default NamespacePipelineRunDetailsView;
