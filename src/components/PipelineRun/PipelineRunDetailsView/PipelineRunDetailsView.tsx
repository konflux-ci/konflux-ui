import * as React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { CONFORMA_TASK } from '~/consts/security';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRunV2 } from '../../../hooks/usePipelineRunsV2';
import { PipelineRunModel } from '../../../models';
import {
  INTEGRATION_TEST_PIPELINE_LIST_PATH,
  PIPELINE_RUNS_DETAILS_PATH,
  PIPELINE_RUNS_LIST_PATH,
  RELEASE_PIPELINE_LIST_PATH,
} from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { isResourceEnterpriseContract } from '../../../utils/conforma-utils';
import { pipelineRunCancel, pipelineRunStop } from '../../../utils/pipeline-actions';
import { isTaskRunInPipelineRun, pipelineRunStatus } from '../../../utils/pipeline-utils';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useApplicationBreadcrumbs } from '../../Applications/breadcrumbs/breadcrumb-utils';
import { DetailsPage } from '../../DetailsPage';
import { StatusIconWithTextLabel } from '../../StatusIcon/StatusIcon';
import { usePipelinererunAction } from '../PipelineRunListView/pipelinerun-actions';

export const PipelineRunDetailsView: React.FC = () => {
  const { pipelineRunName } = useParams<RouterParams>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const releaseName = queryParams.get('releaseName') || '';
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [pipelineRun, loaded, error] = usePipelineRunV2(namespace, pipelineRunName);
  const { cta, isDisabled, disabledTooltip, key, label } = usePipelinererunAction(pipelineRun);

  const [canPatchPipeline] = useAccessReviewForModel(PipelineRunModel, 'patch');

  const plrStatus = React.useMemo(
    () => loaded && pipelineRun && pipelineRunStatus(pipelineRun),
    [loaded, pipelineRun],
  );

  const hasConformaTaskRun = React.useMemo(
    () => isTaskRunInPipelineRun(pipelineRun, CONFORMA_TASK),
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

  const showSecurityTab = isResourceEnterpriseContract(pipelineRun) || hasConformaTaskRun;

  const applicationName = pipelineRun.metadata?.labels[PipelineRunLabel.APPLICATION];
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
          <span className="pf-v5-u-mr-sm">{pipelineRunName}</span>
          <StatusIconWithTextLabel status={plrStatus} />
        </>
      }
      actions={[
        {
          key,
          label,
          isDisabled,
          disabledTooltip,
          onClick: cta,
        },
        {
          key: 'stop',
          label: 'Stop',
          tooltip: 'Let the running tasks complete, then execute finally tasks',
          isDisabled: !(plrStatus && plrStatus === 'Running') || !canPatchPipeline,
          disabledTooltip: !canPatchPipeline ? "You don't have access to stop a build" : undefined,
          onClick: () => pipelineRunStop(pipelineRun),
        },
        {
          key: 'cancel',
          label: 'Cancel',
          tooltip: 'Interrupt any executing non finally tasks, then execute finally tasks',
          isDisabled: !(plrStatus && plrStatus === 'Running') || !canPatchPipeline,
          disabledTooltip: !canPatchPipeline
            ? "You don't have access to cancel a build"
            : undefined,
          onClick: () => pipelineRunCancel(pipelineRun),
        },
      ]}
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
      ]}
    />
  );
};

export default PipelineRunDetailsView;
