import * as React from 'react';
import { useReleasePlans } from '../../../../../../hooks/useReleasePlans';
import { useReleases } from '../../../../../../hooks/useReleases';
import { Condition } from '../../../../../../types';
import { ReleaseKind, ReleasePlanKind } from '../../../../../../types/coreBuildService';
import { K8sResourceCommon } from '../../../../../../types/k8s';
import { conditionsRunStatus, runStatus } from '../../../../../../utils/pipeline-utils';
import { useWorkspaceInfo } from '../../../../../Workspace/useWorkspaceInfo';
import { WorkflowNodeModel, WorkflowNodeModelData, WorkflowNodeType } from '../types';
import {
  emptyPipelineNode,
  groupToPipelineNode,
  resourceToPipelineNode,
  worstWorkflowStatus,
} from '../utils/node-utils';
import { updateParallelNodeWidths } from '../utils/visualization-utils';

const getPlaceholderReleaseNodes = (
  applicationName: string,
  releases: ReleaseKind[],
  releasePlans: ReleasePlanKind[],
  previousTasks: string[],
): WorkflowNodeModel<WorkflowNodeModelData>[] => {
  const placeholdersNeeded = releasePlans.filter(
    (releasePlan) =>
      !releases.find((release) => release.spec.releasePlan === releasePlan.metadata.name),
  );
  if (placeholdersNeeded.length === 0) {
    return [];
  }
  return placeholdersNeeded.map((releasePlan) =>
    emptyPipelineNode(
      `no-release-${releasePlan.metadata.name}`,
      applicationName,
      'No release set',
      WorkflowNodeType.RELEASE,
      previousTasks,
    ),
  );
};

export const useAppReleaseNodes = (
  namespace: string,
  applicationName: string,
  previousTasks: string[],
  expanded: boolean,
): [
  nodes: WorkflowNodeModel<WorkflowNodeModelData>[],
  group: WorkflowNodeModel<WorkflowNodeModelData>,
  tasks: string[],
  loaded: boolean,
  errors: unknown[],
] => {
  const { workspace } = useWorkspaceInfo();
  const [releases, releasesLoaded, releasesError] = useReleases(namespace, workspace);
  const [releasePlans, releasePlansLoaded, releasePlansError] = useReleasePlans(
    namespace,
    workspace,
  );
  const allLoaded = releasesLoaded && releasePlansLoaded;
  const allErrors = [releasesError, releasePlansError].filter((e) => !!e);

  const groupedReleases = React.useMemo(() => {
    if (!allLoaded || allErrors.length > 0) {
      return [];
    }
    const groups: { [key: string]: ReleaseKind[] } = {};
    releases.forEach((release) => {
      const groupId = `release-for-${release.spec.releasePlan}`;
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(release as ReleaseKind);
    });
    return groups;
  }, [releases, allLoaded, allErrors]);

  const releaseNodes = React.useMemo(() => {
    if (!allLoaded || allErrors.length > 0) {
      return [];
    }
    let nodes: WorkflowNodeModel<WorkflowNodeModelData>[];
    if (Object.keys(groupedReleases).length) {
      nodes = Object.keys(groupedReleases).map((key) => {
        if (groupedReleases[key].length === 1) {
          return resourceToPipelineNode(
            groupedReleases[key][0] as K8sResourceCommon,
            applicationName,
            WorkflowNodeType.RELEASE,
            previousTasks,
            conditionsRunStatus(groupedReleases[key][0].status?.conditions as Condition[]),
          );
        }
        const groupedNodes = groupedReleases[key]
          .sort((a, b) => (a.status.startTime > b.status.startTime ? -1 : 1))
          .map((release) =>
            resourceToPipelineNode(
              release as K8sResourceCommon,
              applicationName,
              WorkflowNodeType.RELEASE,
              previousTasks,
              conditionsRunStatus(release.status?.conditions as Condition[]),
            ),
          );
        const latestRelease = groupedReleases[key].reduce(
          (latest: ReleaseKind, release: ReleaseKind) => {
            if (!latest || release.status.startTime > latest.status.startTime) {
              return release;
            }
            return latest;
          },
          null,
        );

        return groupToPipelineNode(
          latestRelease.metadata.uid as string,
          applicationName,
          key,
          WorkflowNodeType.RELEASE,
          previousTasks,
          false,
          undefined,
          groupedNodes as WorkflowNodeModel<WorkflowNodeModelData>[],
          groupedReleases[key] as K8sResourceCommon[],
          conditionsRunStatus(latestRelease.status?.conditions as Condition[]),
        );
      });
      nodes.push(
        ...getPlaceholderReleaseNodes(
          applicationName,
          releases as ReleaseKind[],
          releasePlans,
          previousTasks,
        ),
      );
    } else if (releasePlans?.length) {
      nodes = getPlaceholderReleaseNodes(
        applicationName,
        releases as ReleaseKind[],
        releasePlans,
        previousTasks,
      );
    } else {
      nodes = [
        emptyPipelineNode(
          'no-releases',
          applicationName,
          'No releases set',
          WorkflowNodeType.RELEASE,
          previousTasks,
        ),
      ];
    }
    updateParallelNodeWidths(nodes);
    return nodes;
  }, [
    allLoaded,
    allErrors.length,
    groupedReleases,
    releasePlans,
    applicationName,
    releases,
    previousTasks,
  ]);

  const releaseGroup = React.useMemo(
    () =>
      allLoaded && allErrors.length === 0
        ? groupToPipelineNode(
            'release-plans',
            applicationName,
            releases?.length ? 'Releases' : 'No releases set',
            WorkflowNodeType.RELEASE,
            previousTasks,
            expanded,
            expanded ? releaseNodes?.map((c) => c.id) : undefined,
            releases?.length ? releaseNodes : [],
            releases,
            worstWorkflowStatus(releaseNodes) as runStatus,
          )
        : undefined,
    [allLoaded, allErrors.length, applicationName, releases, previousTasks, expanded, releaseNodes],
  );

  const releaseTasks = React.useMemo(
    () =>
      expanded && releaseNodes?.length ? releaseNodes.map((c) => c.id) : [releaseGroup?.id ?? ''],
    [releaseGroup?.id, releaseNodes, expanded],
  );

  return [releaseNodes, releaseGroup, releaseTasks, allLoaded, allErrors];
};
