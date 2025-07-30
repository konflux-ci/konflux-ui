import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnapshot } from '~/hooks/useSnapshots';
import { PIPELINE_RUNS_LIST_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  PipelineRunEventType,
  PipelineRunLabel,
  PipelineRunType,
} from '../../../consts/pipelinerun';
import { SnapshotLabels } from '../../../consts/snapshots';
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

type RerunActionReturnType = {
  cta: () => Promise<void>;
  isDisabled: boolean;
  disabledTooltip: string | null;
  key: string;
  label: string;
};

const defaultEmptyAction: RerunActionReturnType = {
  cta: () => Promise.resolve(),
  isDisabled: true,
  disabledTooltip: 'Action not available for this build type',
  key: 'rerun',
  label: 'Rerun',
};

export const usePipelinererunAction = (pipelineRun: PipelineRunKind): RerunActionReturnType => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isIntegrationTestsPage = pathname?.includes('integrationtests') ?? false;
  const isSnapshotsPage = pathname?.includes('snapshots') ?? false;
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

  return React.useMemo<RerunActionReturnType>(() => {
    if (!canPatchComponent || !canPatchSnapshot) {
      return {
        ...defaultEmptyAction,
        disabledTooltip: "You don't have access to rerun",
      };
    }

    switch (runType) {
      case PipelineRunType.BUILD: {
        if (!isPushBuildType || !componentLoaded || componentError) {
          return {
            ...defaultEmptyAction,
            disabledTooltip: 'Comment `/retest` on pull request to rerun',
          };
        }

        return {
          ...defaultEmptyAction,
          cta: () =>
            startNewBuild(component).then(() => {
              if (isSnapshotsPage) return;
              navigate(
                `${PIPELINE_RUNS_LIST_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: component.spec.application,
                })}?name=${component.metadata.name}`,
              );
            }),
          isDisabled: false,
          disabledTooltip: null,
        };
      }

      case PipelineRunType.TEST: {
        if (!snapshot || !scenario || snapshotError) {
          return {
            ...defaultEmptyAction,
            disabledTooltip: 'Missing snapshot or scenario',
          };
        }

        return {
          ...defaultEmptyAction,
          cta: () =>
            rerunTestPipeline(snapshot, scenario).then(() => {
              if (isIntegrationTestsPage || isSnapshotsPage) return;
              const componentName = snapshot.metadata.labels?.[SnapshotLabels.COMPONENT];
              navigate(
                `${PIPELINE_RUNS_LIST_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: snapshot.spec.application,
                })}?name=${componentName}`,
              );
            }),
          isDisabled: false,
          disabledTooltip: null,
        };
      }

      case PipelineRunType.TENANT:
      case PipelineRunType.MANAGED:
      case PipelineRunType.RELEASE:
      case PipelineRunType.FINAL: {
        return {
          ...defaultEmptyAction,
          disabledTooltip: `Cannot re-run pipeline run for the type ${runType}`,
        };
      }

      default: {
        return defaultEmptyAction;
      }
    }
  }, [
    canPatchComponent,
    canPatchSnapshot,
    runType,
    isPushBuildType,
    componentLoaded,
    componentError,
    component,
    navigate,
    namespace,
    snapshot,
    scenario,
    snapshotError,
    isIntegrationTestsPage,
    isSnapshotsPage,
  ]);
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
