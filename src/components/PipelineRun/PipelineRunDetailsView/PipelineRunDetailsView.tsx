import * as React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { DetailsPage } from '~/components/DetailsPage';
import { usePipelineRunDetailsPageActions } from '~/components/PipelineRun/PipelineRunListView/pipelinerun-actions';
import { StatusIconWithTextLabel } from '~/components/topology/StatusIcon';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { CONFORMA_TASK, ROXCTL_SCAN_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
import {
  INTEGRATION_TEST_PIPELINE_LIST_PATH,
  PIPELINE_RUNS_DETAILS_PATH,
  PIPELINE_RUNS_LIST_PATH,
  RELEASE_PIPELINE_LIST_PATH,
} from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun, pipelineRunStatus } from '~/utils/pipeline-utils';

export const PipelineRunDetailsView: React.FC = () => {
  const { pipelineRunName } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const releaseName = queryParams.get('releaseName') || '';
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [pipelineRun, loaded, error] = usePipelineRunV2(namespace, pipelineRunName);
  const actions = usePipelineRunDetailsPageActions(pipelineRun);

  const plrStatus = React.useMemo(
    () => (loaded && pipelineRun && !error ? pipelineRunStatus(pipelineRun) : null),
    [loaded, pipelineRun, error],
  );

  useStatusOnFavicon(plrStatus);

  const hasConformaTaskRun = React.useMemo(
    () => isTaskRunInPipelineRun(pipelineRun, CONFORMA_TASK),
    [pipelineRun],
  );
  const showVulnerabilitiesTab = React.useMemo(
    () => isTaskRunInPipelineRun(pipelineRun, ROXCTL_SCAN_TASK),
    [pipelineRun],
  );

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'pipeline run');
  }

  if (!pipelineRun) {
    return getErrorState({ code: 404, message: 'Pipeline run not found' }, true, 'pipeline run');
  }

  const showSecurityTab = isResourceEnterpriseContract(pipelineRun) || hasConformaTaskRun;

  const applicationName = pipelineRun.metadata?.labels?.[PipelineRunLabel.APPLICATION];
  const integrationTestName = queryParams.get('integrationTestName') || '';

  const getDynamicPipelineRunsBreadcrumb = () => ({
    path: (() => {
      if (releaseName) {
        return RELEASE_PIPELINE_LIST_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          releaseName,
        });
      }

      if (integrationTestName) {
        return INTEGRATION_TEST_PIPELINE_LIST_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          integrationTestName,
        });
      }

      return PIPELINE_RUNS_LIST_PATH.createPath({
        workspaceName: namespace,
        applicationName,
      });
    })(),
    name: 'Pipeline runs',
  });

  return (
    <DetailsPage
      data-test="pipelinerun-details-test-id"
      headTitle={pipelineRunName}
      featureFlags={['pipelineruns-kubearchive', 'taskruns-kubearchive']}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        getDynamicPipelineRunsBreadcrumb(),
        {
          path: PIPELINE_RUNS_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            pipelineRunName,
          }),
          name: pipelineRunName,
        },
      ]}
      title={
        <>
          <span className="pf-v6-u-mr-sm">{pipelineRunName}</span>
          {plrStatus ? <StatusIconWithTextLabel status={plrStatus} /> : null}
        </>
      }
      actions={actions}
      baseURL={PIPELINE_RUNS_DETAILS_PATH.createPath({
        workspaceName: namespace,
        applicationName,
        pipelineRunName,
      })}
      tabs={[
        {
          key: 'index',
          label: 'Details',
          isFilled: true,
        },
        {
          key: 'taskruns',
          label: 'Task runs',
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
        ...(showVulnerabilitiesTab
          ? [
              {
                key: 'vulnerabilities',
                label: 'Vulnerabilities',
              },
            ]
          : []),
      ]}
    />
  );
};

export default PipelineRunDetailsView;
