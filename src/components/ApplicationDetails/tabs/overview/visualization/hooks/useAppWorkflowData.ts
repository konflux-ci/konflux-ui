import * as React from 'react';
import {
  getEdgesFromNodes,
  getSpacerNodes,
  Model,
  PipelineNodeModel,
} from '@patternfly/react-topology';
import { runStatus } from '../../../../../../utils/pipeline-utils';
import { useWorkspaceInfo } from '../../../../../Workspace/useWorkspaceInfo';
import { NodeType } from '../const';
import { WorkflowNodeType } from '../types';
import { groupToPipelineNode, worstWorkflowStatus } from '../utils/node-utils';
import { useAppApplicationTestNodes } from './useAppApplicationTestNodes';
import { useAppBuildNodes } from './useAppBuildNodes';
import { useAppComponentsNodes } from './useAppComponentsNodes';
import { useAppReleaseNodes } from './useAppReleaseNodes';

export const useAppWorkflowData = (
  applicationName: string,
  expanded: boolean,
): [model: Model, loaded: boolean, errors: unknown[]] => {
  const { namespace } = useWorkspaceInfo();
  const [componentNodes, componentGroup, componentTasks, componentsLoaded, componentsErrors] =
    useAppComponentsNodes(namespace, applicationName, [], expanded);
  const [buildNodes, buildGroup, buildTasks, buildsLoaded, buildsErrors] = useAppBuildNodes(
    namespace,
    applicationName,
    componentTasks,
    expanded,
  );

  const [
    applicationIntegrationTestNodes,
    applicationIntegrationTestTasks,
    applicationIntegrationTests,
    applicationTestsLoaded,
    applicationErrors,
  ] = useAppApplicationTestNodes(namespace, applicationName, buildTasks, expanded);
  const testsGroup = React.useMemo(() => {
    const testsExist = applicationIntegrationTests?.length || applicationIntegrationTests.length;
    return applicationTestsLoaded
      ? groupToPipelineNode(
          'tests',
          applicationName,
          testsExist ? 'Tests' : 'No tests set',
          WorkflowNodeType.TESTS,
          buildTasks,
          expanded,
          expanded ? applicationIntegrationTestTasks : undefined,
          testsExist ? applicationIntegrationTestNodes : [],
          applicationIntegrationTests,
          worstWorkflowStatus(applicationIntegrationTestNodes) as runStatus,
        )
      : undefined;
  }, [
    applicationTestsLoaded,
    applicationName,
    applicationIntegrationTests,
    buildTasks,
    expanded,
    applicationIntegrationTestTasks,
    applicationIntegrationTestNodes,
  ]);

  const [releaseNodes, releaseGroup, , releasesLoaded, releasesError] = useAppReleaseNodes(
    namespace,
    applicationName,
    expanded ? applicationIntegrationTestTasks : [testsGroup?.id ?? ''],
    expanded,
  );

  const allResourcesLoaded: boolean =
    componentsLoaded && buildsLoaded && applicationTestsLoaded && releasesLoaded;

  const errors = [...componentsErrors, ...buildsErrors, ...applicationErrors, ...releasesError];

  if (!allResourcesLoaded || errors.length > 0) {
    return [{ nodes: [], edges: [] }, allResourcesLoaded, errors];
  }

  if (expanded) {
    const resourceNodes: PipelineNodeModel[] = [
      ...(componentNodes?.length ? componentNodes : [componentGroup]),
      ...(buildNodes?.length ? buildNodes : [buildGroup]),
      ...applicationIntegrationTestNodes,
      ...(releaseNodes?.length ? releaseNodes : [releaseGroup]),
    ];
    const spacerNodes = getSpacerNodes(resourceNodes, NodeType.SPACER_NODE);
    const nodes = [
      ...resourceNodes,
      ...spacerNodes,
      componentGroup,
      buildGroup,
      testsGroup,
      releaseGroup,
    ];
    const edges = getEdgesFromNodes(nodes, NodeType.SPACER_NODE);

    return [{ nodes, edges }, true, errors];
  }
  const nodes = [componentGroup, buildGroup, testsGroup, releaseGroup];
  const edges = getEdgesFromNodes(nodes, NodeType.SPACER_NODE);

  return [{ nodes, edges }, true, errors];
};
