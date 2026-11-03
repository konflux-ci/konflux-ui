import { Model, NodeModel, EdgeModel, ModelKind } from '@patternfly/react-topology';
import { PipelineLayout } from '~/components/topology/factories/layoutFactory';
import { TestGraphNode } from '~/types';
import { TestGraphNodeType, TestGraphEdgeType } from './testgraph-visualization-types';

/**
 * Calculate stages via recursive depth.
 * Cycles: break at detection point (stage 0). Missing deps: filtered out.
 */
const calculateStages = (testGraph: Record<string, TestGraphNode[]>): Map<string, number> => {
  const stages = new Map<string, number>();
  const inProgress = new Set<string>(); // recursion stack for cycle detection

  const getStage = (testName: string): number => {
    if (stages.has(testName)) return stages.get(testName);

    // Cycle detected: lock at stage 0, prevents overwrite when recursion unwinds
    if (inProgress.has(testName)) {
      stages.set(testName, 0);
      return 0;
    }

    inProgress.add(testName);
    const deps = (testGraph[testName] || []).filter((d) => testGraph[d.name]);

    const stage = deps.length === 0 ? 0 : Math.max(...deps.map((d) => getStage(d.name))) + 1;

    inProgress.delete(testName);
    if (!stages.has(testName)) {
      stages.set(testName, stage);
    }
    return stages.get(testName);
  };

  Object.keys(testGraph).sort().forEach(getStage);
  return stages;
};

export const getTestGraphModel = (
  testGraph: Record<string, TestGraphNode[]>,
  groupName: string,
): Model => {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];

  // Calculate stages and group tests by stage
  const testStages = calculateStages(testGraph);
  const stageGroups = Array.from(testStages.entries()).reduce(
    (acc, [testName, stage]) => {
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(testName);
      return acc;
    },
    {} as Record<number, string[]>,
  );

  // Create group nodes for each stage
  Object.entries(stageGroups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([stage, testNames]) => {
      nodes.push({
        id: `stage-${stage}`,
        type: TestGraphNodeType.GROUP,
        label: `Stage ${Number(stage) + 1}`,
        group: true,
        children: testNames,
        style: { padding: 20 },
      });
    });

  // Create test nodes and edges
  Object.entries(testGraph).forEach(([testName, deps]) => {
    const validDeps = deps.filter((dep) => testGraph[dep.name]);

    // Test node
    nodes.push({
      id: testName,
      type: TestGraphNodeType.TEST_NODE,
      label: testName,
      width: 180,
      height: 32,
      data: { failFast: validDeps.some((d) => d.failFast), groupName },
    });

    // Dependency edges
    validDeps.forEach((dep) => {
      edges.push({
        id: `${dep.name}-to-${testName}`,
        type: TestGraphEdgeType.TEST_EDGE,
        source: dep.name,
        target: testName,
      });
    });
  });

  return {
    graph: {
      id: 'test-graph',
      type: ModelKind.graph,
      layout: PipelineLayout.PIPELINERUN_VISUALIZATION,
    },
    nodes,
    edges,
  };
};
