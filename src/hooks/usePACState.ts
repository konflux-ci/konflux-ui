import * as React from 'react';
import { PipelineRunEventType, PipelineRunLabel, PipelineRunType } from '../consts/pipelinerun';
import { ComponentKind } from '../types';
import {
  SAMPLE_ANNOTATION,
  getPACProvision,
  ComponentBuildState,
  BUILD_REQUEST_ANNOTATION,
  BuildRequest,
  useComponentBuildStatus,
  LAST_CONFIGURATION_ANNOTATION,
  BUILD_STATUS_ANNOTATION,
} from '../utils/component-utils';
import { useApplicationPipelineGitHubApp } from './useApplicationPipelineGitHubApp';
import { usePipelineRuns } from './usePipelineRuns';

export enum PACState {
  sample,
  disabled,
  configureRequested,
  unconfigureRequested,
  error,
  pending,
  ready,
  loading,
}

const usePACState = (component: ComponentKind) => {
  const isSample = component.metadata?.annotations?.[SAMPLE_ANNOTATION] === 'true';
  const isMigrationRequested =
    component.metadata?.annotations?.[BUILD_REQUEST_ANNOTATION] === BuildRequest.migratePac;
  const pacProvision = getPACProvision(component);
  const isConfigureRequested =
    component.metadata?.annotations?.[BUILD_REQUEST_ANNOTATION] === BuildRequest.configurePac;
  const isUnconfigureRequested =
    component.metadata?.annotations?.[BUILD_REQUEST_ANNOTATION] === BuildRequest.unconfigurePac;

  const { name: prBotName } = useApplicationPipelineGitHubApp();

  const buildStatus = useComponentBuildStatus(component);
  let lastConfiguration = null;
  try {
    lastConfiguration = component.metadata?.annotations?.[LAST_CONFIGURATION_ANNOTATION]
      ? JSON.parse(component.metadata?.annotations?.[LAST_CONFIGURATION_ANNOTATION])
      : undefined;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error parsing last-applied-configuration annotation:', e);
  }
  const lastPACStateIsMigration =
    lastConfiguration?.metadata?.annotations?.[BUILD_REQUEST_ANNOTATION] ===
    BuildRequest.migratePac;

  const configurationTime: string = lastPACStateIsMigration
    ? lastConfiguration?.metadata?.annotations?.[BUILD_STATUS_ANNOTATION].pac?.[
        'configuration-time'
      ]
    : buildStatus?.pac?.['configuration-time'];

  const [pipelineBuildRuns, pipelineBuildRunsLoaded, pipelineBuildRunsError] = usePipelineRuns(
    !isSample && pacProvision ? component.metadata.namespace : null,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.APPLICATION]: component.spec.application,
            [PipelineRunLabel.COMPONENT]: component.metadata.name,
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
          },
          matchExpressions: [
            { key: PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL, operator: 'DoesNotExist' },
          ],
        },
        // this limit is based on the assumption that user merges the PR after the component is created
        limit: 10,
      }),
      [component.metadata.name, component.spec.application],
    ),
  );

  // filter out runs that were created if the component previously had pac configured
  const runsForComponent = React.useMemo(
    () =>
      !pipelineBuildRunsLoaded || pipelineBuildRunsError
        ? []
        : pipelineBuildRuns?.filter((p) =>
            configurationTime
              ? new Date(p.metadata.creationTimestamp) > new Date(configurationTime)
              : true,
          ),
    [configurationTime, pipelineBuildRuns, pipelineBuildRunsLoaded, pipelineBuildRunsError],
  );

  const prMerged = runsForComponent.find(
    (r) => !r.metadata?.annotations?.[PipelineRunLabel.COMMIT_USER_LABEL]?.includes(prBotName),
  );

  return isSample
    ? PACState.sample
    : isConfigureRequested || isMigrationRequested
      ? PACState.configureRequested
      : isUnconfigureRequested
        ? PACState.unconfigureRequested
        : pacProvision === ComponentBuildState.enabled
          ? !pipelineBuildRunsLoaded
            ? PACState.loading
            : prMerged
              ? PACState.ready
              : PACState.pending
          : !pacProvision || pacProvision === ComponentBuildState.disabled
            ? PACState.disabled
            : PACState.error;
};

export default usePACState;
