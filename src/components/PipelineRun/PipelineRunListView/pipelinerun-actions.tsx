import { useNavigate } from 'react-router-dom';
import { useSnapshot } from '~/hooks/useSnapshots';
import { PIPELINE_RUNS_LIST_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  PipelineRunEventType,
  PipelineRunLabel,
  PipelineRunType,
} from '../../../consts/pipelinerun';
import { useComponent } from '../../../hooks/useComponents';
import { K8sQueryPatchResource } from '../../../k8s';
import { ComponentModel, PipelineRunModel, SnapshotModel } from '../../../models';
import { Action } from '../../../shared/components/action-menu/types';
import { PipelineRunKind } from '../../../types';
import { Snapshot } from '../../../types/coreBuildService';
import { startNewBuild } from '../../../utils/component-utils';
import { pipelineRunCancel, pipelineRunStop } from '../../../utils/pipeline-actions';
import { pipelineRunStatus, runStatus } from '../../../utils/pipeline-utils';
import { useAccessReviewForModel } from '../../../utils/rbac';

interface PipelineRunQueryParams {
  releaseName?: string;
  integrationTestName?: string;
}

export const BUILD_REQUEST_LABEL = 'test.appstudio.openshift.io/run';

// [TODO]: remove this once Snapshot details page is added

export const rerunTestPipeline = (snapshot: Snapshot, scenario) => {
  return K8sQueryPatchResource({
    model: SnapshotModel,
    queryOptions: {
      name: snapshot.metadata.name,
      ns: snapshot.metadata.namespace,
    },
    patches: [
      {
        op: 'add',
        path: `/metadata/labels/${BUILD_REQUEST_LABEL.replace('/', '~1')}`,
        value: scenario,
      },
    ],
  });
};

export const usePipelinererunAction = (pipelineRun: PipelineRunKind) => {
  const navigate = useNavigate();
  const namespace = useNamespace();
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [canPatchSnapshot] = useAccessReviewForModel(SnapshotModel, 'patch');

  const [component, componentLoaded, componentError] = useComponent(
    namespace,
    pipelineRun?.metadata?.labels?.[PipelineRunLabel.COMPONENT],
  );

  const snapShotLabel = pipelineRun?.metadata?.labels?.[PipelineRunLabel.SNAPSHOT];

  const [snapshot, , snapshotError] = useSnapshot(namespace, snapShotLabel);

  const isPushBuildType = [PipelineRunEventType.PUSH, PipelineRunEventType.INCOMING].includes(
    pipelineRun?.metadata?.labels?.[
      PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL
    ]?.toLowerCase() as PipelineRunEventType,
  );
  const runType = pipelineRun?.metadata?.labels[PipelineRunLabel.PIPELINE_TYPE];

  const scenario = pipelineRun?.metadata?.labels?.[PipelineRunLabel.TEST_SERVICE_SCENARIO];

  return {
    cta: () =>
      runType === PipelineRunType.BUILD && isPushBuildType
        ? componentLoaded &&
          !componentError &&
          startNewBuild(component).then(() => {
            navigate(
              `${PIPELINE_RUNS_LIST_PATH.createPath({
                workspaceName: namespace,
                applicationName: component.spec.application,
              })}?name=${component.metadata.name}`,
            );
          })
        : runType === PipelineRunType.TEST &&
          snapshot &&
          scenario &&
          rerunTestPipeline(snapshot, scenario).then(() => {
            navigate(
              `${PIPELINE_RUNS_LIST_PATH.createPath({
                workspaceName: namespace,
                applicationName: component.spec.application,
              })}?name=${component.metadata.name}`,
            );
          }),
    isDisabled:
      (runType === PipelineRunType.BUILD && (!isPushBuildType || !canPatchComponent)) ||
      (runType === PipelineRunType.TEST && (!canPatchSnapshot || !snapshot || !scenario)),

    disabledTooltip:
      (runType === PipelineRunType.BUILD && !canPatchComponent) ||
      (runType === PipelineRunType.TEST && !canPatchSnapshot)
        ? "You don't have access to rerun"
        : runType === PipelineRunType.TEST && (!snapshot || snapshotError || !scenario)
          ? 'Missing snapshot or scenario'
          : runType === PipelineRunType.BUILD && !isPushBuildType
            ? 'Comment `/retest` on pull request to rerun'
            : null,
    key: 'rerun',
    label: 'Rerun',
  };
};

export const usePipelinerunActions = (pipelineRun: PipelineRunKind): Action[] => {
  const { cta, isDisabled, disabledTooltip, key, label } = usePipelinererunAction(pipelineRun);

  const [canPatchPipelineRun] = useAccessReviewForModel(PipelineRunModel, 'patch');

  return [
    {
      id: key,
      label,
      disabled: isDisabled,
      disabledTooltip,
      cta,
    },
    {
      cta: () => pipelineRunStop(pipelineRun),
      id: 'pipelinerun-stop',
      label: 'Stop',
      tooltip: 'Let the running tasks complete, then execute "finally" tasks',
      disabled: !(pipelineRunStatus(pipelineRun) === runStatus.Running) || !canPatchPipelineRun,
      disabledTooltip: !canPatchPipelineRun
        ? "You don't have access to stop this pipeline"
        : undefined,
    },
    {
      cta: () => pipelineRunCancel(pipelineRun),
      id: 'pipelinerun-cancel',
      label: 'Cancel',
      tooltip: 'Interrupt any executing non "finally" tasks, then execute "finally" tasks',
      disabled: !(pipelineRunStatus(pipelineRun) === runStatus.Running) || !canPatchPipelineRun,
      disabledTooltip: !canPatchPipelineRun
        ? "You don't have access to cancel this pipeline"
        : undefined,
    },
  ];
};

export const buildPipelineRunQuery = ({
  releaseName,
  integrationTestName,
}: PipelineRunQueryParams): string => {
  switch (true) {
    case releaseName != null:
      return `?releaseName=${encodeURIComponent(releaseName)}`;
    case integrationTestName != null:
      return `?integrationTestName=${encodeURIComponent(integrationTestName)}`;
    default:
      return '';
  }
};
