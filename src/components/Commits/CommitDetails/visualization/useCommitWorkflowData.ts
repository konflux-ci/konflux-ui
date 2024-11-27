import * as React from 'react';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import { useIntegrationTestScenarios } from '../../../../hooks/useIntegrationTestScenarios';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { Commit, ComponentKind, PipelineRunKind } from '../../../../types';
import { pipelineRunStatus, runStatus } from '../../../../utils/pipeline-utils';
import { DEFAULT_NODE_HEIGHT } from '../../../topology/const';
import { getLabelWidth } from '../../../topology/utils';
import { useWorkspaceInfo } from '../../../Workspace/useWorkspaceInfo';
import {
  CommitWorkflowNodeModel,
  CommitWorkflowNodeType,
  NodeType,
} from './commit-visualization-types';
import { addPrefixToResourceName } from './commit-visualization-utils';

export const getLatestResource = (resources = []) =>
  resources
    ?.sort?.(
      (a, b) =>
        new Date(b.metadata.creationTimestamp as string).getTime() -
        new Date(a.metadata.creationTimestamp as string).getTime(),
    )
    .slice(0, 1)
    .shift();

export const useCommitWorkflowData = (
  commit: Commit,
): [nodes: CommitWorkflowNodeModel[], loaded: boolean, errors: unknown[]] => {
  const { namespace, workspace } = useWorkspaceInfo();

  const applicationName = commit?.application || '';
  const [components, componentsLoaded] = useComponents(namespace, workspace, applicationName);
  const [integrationTests, integrationTestsLoaded] = useIntegrationTestScenarios(
    namespace,
    workspace,
    applicationName,
  );
  const [pipelines, pipelinesLoaded, pipelinesError] = usePipelineRunsForCommit(
    namespace,
    workspace,
    applicationName,
    commit.sha,
  );

  const buildPipelines = React.useMemo(
    () =>
      pipelinesLoaded
        ? pipelines.filter(
            (plr) => plr.metadata?.labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
          )
        : [],
    [pipelines, pipelinesLoaded],
  );
  const testPipelines = React.useMemo(
    () =>
      pipelinesLoaded
        ? pipelines.filter(
            (plr) => plr.metadata?.labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.TEST,
          )
        : [],
    [pipelines, pipelinesLoaded],
  );

  const allResourcesLoaded: boolean = componentsLoaded && integrationTestsLoaded && pipelinesLoaded;
  const allErrors = [pipelinesError].filter((e) => !!e);

  const commitComponents = React.useMemo(
    () =>
      buildPipelines.map((bp) => bp.metadata.labels[PipelineRunLabel.COMPONENT]).filter((n) => n),
    [buildPipelines],
  );

  const workflowNodes: CommitWorkflowNodeModel[] = React.useMemo(() => {
    const nodes: CommitWorkflowNodeModel[] = [];
    const commitNode: CommitWorkflowNodeModel = {
      id: 'commit',
      label: 'commit',
      type: NodeType.WORKFLOW_NODE,
      width: getLabelWidth('commit'),
      height: DEFAULT_NODE_HEIGHT,
      runAfterTasks: [],
      data: {
        status: runStatus.Succeeded,
        label: 'commit',
        workflowType: CommitWorkflowNodeType.COMMIT,
        isDisabled: false,
        resource: commit,
        application: commit.application,
      },
    };
    nodes.push(commitNode);

    components.forEach((component: ComponentKind) => {
      const {
        metadata: { name: compName },
      } = component;

      if (!commitComponents.includes(compName) || !allResourcesLoaded || allErrors.length > 0) {
        return;
      }

      const latestBuildPipeline: PipelineRunKind = getLatestResource(
        buildPipelines.filter(
          (bp: PipelineRunKind) => bp.metadata?.labels[PipelineRunLabel.COMPONENT] === compName,
        ),
      );

      const name = component.metadata.name;

      const buildName = `${name}-build`;
      const buildNode: CommitWorkflowNodeModel = {
        id: buildName,
        label: buildName,
        type: NodeType.WORKFLOW_NODE,
        width: getLabelWidth(buildName),
        height: DEFAULT_NODE_HEIGHT,
        runAfterTasks: [commitNode.id],
        data: {
          status: pipelineRunStatus(latestBuildPipeline),
          workflowType: CommitWorkflowNodeType.BUILD,
          resource: latestBuildPipeline,
          application: commit.application,
        },
      };
      nodes.push(buildNode);

      const integrationTestPipelines = testPipelines.filter(
        (tp) => tp.metadata?.labels[PipelineRunLabel.COMPONENT] === compName,
      );

      const appTestNodes: CommitWorkflowNodeModel[] = integrationTests.length
        ? integrationTests.map((test) => {
            const testName = test.metadata.name;
            const matchedTest = getLatestResource(
              integrationTestPipelines.filter(
                (tp) =>
                  tp.metadata.labels?.[PipelineRunLabel.TEST_SERVICE_SCENARIO] ===
                  test.metadata.name,
              ),
            );

            const testNode: CommitWorkflowNodeModel = {
              id: addPrefixToResourceName(compName, testName),
              label: testName,
              type: NodeType.WORKFLOW_NODE,
              width: getLabelWidth(testName),
              height: DEFAULT_NODE_HEIGHT,
              runAfterTasks: [buildNode.id],
              data: {
                status: matchedTest
                  ? pipelineRunStatus(matchedTest as PipelineRunKind)
                  : runStatus.Pending,
                workflowType: CommitWorkflowNodeType.APPLICATION_TEST,
                resource: matchedTest,
                application: commit.application,
              },
            };
            return testNode;
          })
        : [
            {
              id: `${name}-application-integration-test`,
              label: 'No app integration test set',
              type: NodeType.WORKFLOW_NODE,
              width: getLabelWidth('No app integration test set'),
              height: DEFAULT_NODE_HEIGHT,
              runAfterTasks: [buildNode.id],
              data: {
                status: runStatus.Pending,
                workflowType: CommitWorkflowNodeType.APPLICATION_TEST,
                application: commit.application,
              },
            },
          ];
      nodes.push(...appTestNodes);
      const appTestNodesWidth = appTestNodes.reduce((max, node) => Math.max(max, node.width), 0);
      appTestNodes.forEach((n) => (n.width = appTestNodesWidth));
    });

    return nodes;
  }, [
    commit,
    components,
    commitComponents,
    allResourcesLoaded,
    allErrors.length,
    buildPipelines,
    testPipelines,
    integrationTests,
  ]);

  if (!allResourcesLoaded || workflowNodes.length === 0 || allErrors.length > 0) {
    return [[], allResourcesLoaded, allErrors];
  }

  return [workflowNodes, allResourcesLoaded, allErrors];
};
