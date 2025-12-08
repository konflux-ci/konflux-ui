import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnapshot } from '~/hooks/useSnapshots';
import { PIPELINE_RUNS_LIST_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  PipelineRunEventType,
  PipelineRunLabel,
  PipelineRunType,
  runStatus,
} from '../../../consts/pipelinerun';
import { useComponent } from '../../../hooks/useComponents';
import { K8sQueryPatchResource, k8sQueryGetResource } from '../../../k8s';
import { ComponentModel, PipelineRunModel, SnapshotModel } from '../../../models';
import { Action } from '../../../shared/components/action-menu/types';
import { useLazyActionMenu, composeLazyActions, LazyActionHookResult } from '../../../shared/hooks';
import { ComponentKind, PipelineRunKind } from '../../../types';
import { Snapshot } from '../../../types/coreBuildService';
import { startNewBuild } from '../../../utils/component-utils';
import { pipelineRunCancel, pipelineRunStop } from '../../../utils/pipeline-actions';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
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

  const eventType = pipelineRun?.metadata?.labels?.[
    PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL
  ]?.toLowerCase() as PipelineRunEventType;
  const isPR = eventType === PipelineRunEventType.PULL;
  if (eventType !== PipelineRunEventType.PULL && eventType !== PipelineRunEventType.RETEST) {
    // eslint-disable-next-line no-console
    console.warn(`Unknown event type: ${eventType}. Assuming not a PR.`);
  }

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
            disabledTooltip: isPR
              ? 'To rerun the build pipeline for the latest commit in this PR, comment `/retest` on the pull request'
              : 'Rerun of a specific build pipeline is not supported.',
          };
        }

        return {
          ...defaultEmptyAction,
          cta: () =>
            startNewBuild(component).then(() => {
              if (isSnapshotsPage) return;
              navigate(
                PIPELINE_RUNS_LIST_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: component.spec.application,
                }),
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
              navigate(
                PIPELINE_RUNS_LIST_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: snapshot.spec.application,
                }),
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
    isPR,
  ]);
};

/**
 * @deprecated use usePipelinerunActionsLazy instead
 */
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

export const useRerunActionLazy = (pipelineRun: PipelineRunKind): LazyActionHookResult<Action> => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const namespace = useNamespace();
  const isIntegrationTestsPage = pathname?.includes('integrationtests') ?? false;
  const isSnapshotsPage = pathname?.includes('snapshots') ?? false;
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [canPatchSnapshot] = useAccessReviewForModel(SnapshotModel, 'patch');
  const canPatchCompSnap = canPatchComponent && canPatchSnapshot;

  const labels = pipelineRun?.metadata?.labels ?? {};
  const runType = labels[PipelineRunLabel.PIPELINE_TYPE];
  const scenario = labels?.[PipelineRunLabel.TEST_SERVICE_SCENARIO];
  const componentName = labels?.[PipelineRunLabel.COMPONENT];
  const snapshotName = labels?.[PipelineRunLabel.SNAPSHOT];
  const applicationName = labels?.[PipelineRunLabel.APPLICATION];
  const eventType = labels?.[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]?.toLowerCase() as
    | PipelineRunEventType
    | undefined;
  const isPR = eventType === PipelineRunEventType.PULL;
  const isPushBuildType =
    eventType === PipelineRunEventType.PUSH || eventType === PipelineRunEventType.INCOMING;

  return useLazyActionMenu({
    loadContext: async () => {
      // Only load resources lazily - permissions are already checked upfront
      let component: ComponentKind | null = null;
      let snapshot: Snapshot | null = null;

      if (runType === PipelineRunType.BUILD && isPushBuildType && componentName) {
        component = await k8sQueryGetResource<ComponentKind>({
          model: ComponentModel,
          queryOptions: { ns: namespace, name: componentName },
        });
      }

      if (runType === PipelineRunType.TEST && snapshotName) {
        snapshot = await k8sQueryGetResource<Snapshot>({
          model: SnapshotModel,
          queryOptions: { ns: namespace, name: snapshotName },
        });
      }

      return { component, snapshot };
    },
    buildActions: (ctx): Action[] => {
      const rerunCtx = ctx as { component: ComponentKind | null; snapshot: Snapshot | null } | null;

      if (!canPatchCompSnap) {
        return [
          {
            id: 'rerun',
            label: 'Rerun',
            cta: () => Promise.resolve(),
            disabled: true,
            disabledTooltip: "You don't have access to rerun",
          },
        ];
      }

      switch (runType) {
        case PipelineRunType.BUILD: {
          if (!isPushBuildType || isPR) {
            return [
              {
                id: 'rerun',
                label: 'Rerun',
                cta: () => Promise.resolve(),
                disabled: true,
                disabledTooltip: isPR
                  ? 'To rerun the build pipeline for the latest commit in this PR, comment `/retest` on the pull request'
                  : 'Rerun of a specific build pipeline is not supported.',
              },
            ];
          }
          if (!rerunCtx?.component) {
            return [
              {
                id: 'rerun',
                label: 'Rerun',
                cta: () => Promise.resolve(),
                disabled: true,
                disabledTooltip: 'Component not available',
              },
            ];
          }
          return [
            {
              id: 'rerun',
              label: 'Rerun',
              cta: () =>
                startNewBuild(rerunCtx.component).then(() => {
                  if (isSnapshotsPage) return;
                  navigate(
                    PIPELINE_RUNS_LIST_PATH.createPath({
                      workspaceName: namespace,
                      applicationName,
                    }),
                  );
                }),
              disabled: false,
              disabledTooltip: undefined,
            },
          ];
        }
        case PipelineRunType.TEST: {
          if (!rerunCtx?.snapshot || !scenario) {
            return [
              {
                id: 'rerun',
                label: 'Rerun',
                cta: () => Promise.resolve(),
                disabled: true,
                disabledTooltip: 'Missing snapshot or scenario',
              },
            ];
          }
          return [
            {
              id: 'rerun',
              label: 'Rerun',
              cta: () =>
                rerunTestPipeline(rerunCtx.snapshot, scenario).then(() => {
                  if (isIntegrationTestsPage || isSnapshotsPage) return;
                  navigate(
                    PIPELINE_RUNS_LIST_PATH.createPath({
                      workspaceName: namespace,
                      applicationName: rerunCtx.snapshot?.spec.application,
                    }),
                  );
                }),
              disabled: false,
              disabledTooltip: undefined,
            },
          ];
        }
        case PipelineRunType.TENANT:
        case PipelineRunType.MANAGED:
        case PipelineRunType.RELEASE:
        case PipelineRunType.FINAL:
          return [
            {
              id: 'rerun',
              label: 'Rerun',
              cta: () => Promise.resolve(),
              disabled: true,
              disabledTooltip: `Cannot re-run pipeline run for the type ${runType}`,
            },
          ];
        default:
          return [
            {
              id: 'rerun',
              label: 'Rerun',
              cta: () => Promise.resolve(),
              disabled: true,
              disabledTooltip: 'Action not available for this build type',
            },
          ];
      }
    },
  });
};

export const useStopCancelActionsLazy = (
  pipelineRun: PipelineRunKind,
): LazyActionHookResult<Action> => {
  const [canPatchPipelineRun] = useAccessReviewForModel(PipelineRunModel, 'patch');

  return useLazyActionMenu({
    buildActions: () => {
      const canPatch = canPatchPipelineRun;
      const status = pipelineRunStatus(pipelineRun);
      const isRunning = status === runStatus.Running;

      return [
        {
          cta: () => pipelineRunStop(pipelineRun),
          id: 'pipelinerun-stop',
          label: 'Stop',
          tooltip: 'Let the running tasks complete, then execute "finally" tasks',
          disabled: !isRunning || !canPatch,
          disabledTooltip: !canPatch ? "You don't have access to stop this pipeline" : undefined,
        },
        {
          cta: () => pipelineRunCancel(pipelineRun),
          id: 'pipelinerun-cancel',
          label: 'Cancel',
          tooltip: 'Interrupt any executing non "finally" tasks, then execute "finally" tasks',
          disabled: !isRunning || !canPatch,
          disabledTooltip: !canPatch ? "You don't have access to cancel this pipeline" : undefined,
        },
      ];
    },
  });
};

export const usePipelinerunActionsLazy = (
  pipelineRun: PipelineRunKind,
): LazyActionHookResult<Action> => {
  const rerunHook = useRerunActionLazy(pipelineRun);
  const stopCancelHook = useStopCancelActionsLazy(pipelineRun);

  return composeLazyActions(rerunHook, stopCancelHook);
};
