import { Model, NodeModel, EdgeModel, ModelKind } from '@patternfly/react-topology';
import { PipelineLayout } from '~/components/topology/factories/layoutFactory';
import { TestGraphNode } from '~/types';
import { TestGraphNodeType, TestGraphEdgeType } from './testgraph-visualization-types';

/**
 * Calculate each test's stage from its dependencies: a test's stage is one
 * more than the highest stage of the tests it depends on.
 * Cycles are broken by treating a test that is already being visited as
 * stage 0. Dependencies missing from the graph are ignored.
 */
const calculateStages = (testGraph: Record<string, TestGraphNode[]>): Map<string, number> => {
  const stages = new Map<string, number>();
  const inProgress = new Set<string>(); // tests currently being calculated, used to spot cycles

  const getStage = (testName: string): number => {
    if (stages.has(testName)) return stages.get(testName);

    // Cycle: this test is already being calculated further up the call stack.
    // Return 0 just to stop the recursion — its real stage is set below.
    if (inProgress.has(testName)) return 0;

    inProgress.add(testName);
    const deps = (testGraph[testName] || []).filter((d) =>
      Object.prototype.hasOwnProperty.call(testGraph, d.name),
    );

    const stage = deps.length === 0 ? 0 : Math.max(...deps.map((d) => getStage(d.name))) + 1;

    inProgress.delete(testName);
    stages.set(testName, stage);
    return stage;
  };

  Object.keys(testGraph).sort().forEach(getStage);
  return stages;
};

export const getTestGraphModel = (
  testGraph: Record<string, TestGraphNode[]>,
  groupName: string,
  namespace: string,
): Model => {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];

  // A test is fail-fast when any dependent lists it as a dependency with
  // failFast: true — i.e. if this test fails, its dependent tests are skipped
  const failFastTests = new Set<string>();
  Object.values(testGraph).forEach((deps) =>
    deps.forEach((d) => {
      if (d.failFast) failFastTests.add(d.name);
    }),
  );

  // Calculate stages and group tests by stage
  const testStages = calculateStages(testGraph);
  // Cycles can leave gaps in the stage numbers (e.g. no stage 0), so renumber
  // the stages that are in use to 0, 1, 2, ...
  const usedStages = [...new Set(testStages.values())].sort((a, b) => a - b);
  const stageGroups: Record<number, string[]> = {};
  testStages.forEach((stage, testName) => {
    const stageIndex = usedStages.indexOf(stage);
    stageGroups[stageIndex] = [...(stageGroups[stageIndex] || []), testName];
  });

  // Create group nodes for each stage
  Object.entries(stageGroups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([stage, testNames]) => {
      nodes.push({
        id: `stage:${stage}`,
        type: TestGraphNodeType.GROUP,
        label: `Stage ${Number(stage) + 1}`,
        group: true,
        children: testNames,
        style: { padding: 20 },
      });
    });

  // Create test nodes and edges
  Object.entries(testGraph).forEach(([testName, deps]) => {
    const validDeps = deps.filter((dep) =>
      Object.prototype.hasOwnProperty.call(testGraph, dep.name),
    );

    // Test node
    nodes.push({
      id: testName,
      type: TestGraphNodeType.TEST_NODE,
      label: testName,
      width: 180,
      height: 32,
      data: { failFast: failFastTests.has(testName), groupName, namespace },
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
      layout: PipelineLayout.TESTGRAPH_VISUALIZATION,
    },
    nodes,
    edges,
  };
};
