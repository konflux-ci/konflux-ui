import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { DetailsPage } from '~/components/DetailsPage';
import { usePipelineRunDetailsPageActions } from '~/components/PipelineRun/PipelineRunListView/pipelinerun-actions';
import { StatusIconWithTextLabel } from '~/components/topology/StatusIcon';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { CONFORMA_TASK, ROXCTL_SCAN_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
import { NAMESPACE_PIPELINE_RUN_DETAILS_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { getPipelineRunBreadcrumbs, getPipelineRunDetailsPath } from '~/utils/pipeline-run-routes';
import { isTaskRunInPipelineRun, pipelineRunStatus } from '~/utils/pipeline-utils';

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
  const actions = usePipelineRunDetailsPageActions(run, breadcrumbs?.[2]?.path ?? baseURL);
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
        ...(isResourceEnterpriseContract(run) || isTaskRunInPipelineRun(run, CONFORMA_TASK)
          ? [{ key: 'security', label: 'Security' }]
          : []),
        ...(isTaskRunInPipelineRun(run, ROXCTL_SCAN_TASK)
          ? [{ key: 'vulnerabilities', label: 'Vulnerabilities' }]
          : []),
      ]}
      actions={actions}
    />
  );
};

export default NamespacePipelineRunDetailsView;
