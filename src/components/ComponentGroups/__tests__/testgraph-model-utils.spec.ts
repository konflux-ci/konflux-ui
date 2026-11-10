import { TestGraphNode } from '~/types';
import { getTestGraphModel } from '../testgraph-model-utils';
import { TestGraphNodeType, TestGraphEdgeType } from '../testgraph-visualization-types';

describe('testgraph-model-utils', () => {
  describe('getTestGraphModel', () => {
    it('should create a model with a single test node at stage 1', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'smoke-tests': [],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      expect(model.nodes).toHaveLength(2); // 1 group + 1 test
      expect(model.edges).toHaveLength(0);

      // Stage group
      expect(model.nodes?.[0]).toMatchObject({
        id: 'stage:0',
        type: TestGraphNodeType.GROUP,
        label: 'Stage 1',
        group: true,
        children: ['smoke-tests'],
      });

      // Test node
      expect(model.nodes?.[1]).toMatchObject({
        id: 'smoke-tests',
        type: TestGraphNodeType.TEST_NODE,
        label: 'smoke-tests',
        data: { groupName: 'my-group', namespace: 'test-ns' },
      });
    });

    it('should create multiple stages based on dependencies', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'smoke-tests': [],
        'security-tests': [],
        'integration-tests': [{ name: 'smoke-tests', failFast: false }],
        'e2e-tests': [
          { name: 'integration-tests', failFast: true },
          { name: 'security-tests', failFast: false },
        ],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      // 4 test nodes + 3 stage groups (stages 1, 2, 3)
      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);
      const testNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.TEST_NODE);

      expect(groupNodes).toHaveLength(3);
      expect(testNodes).toHaveLength(4);

      // Stage 1: smoke-tests, security-tests
      const stage1 = groupNodes?.find((n) => n.label === 'Stage 1');
      expect(stage1?.children).toHaveLength(2);
      expect(stage1?.children).toContain('smoke-tests');
      expect(stage1?.children).toContain('security-tests');

      // Stage 2: integration-tests
      const stage2 = groupNodes?.find((n) => n.label === 'Stage 2');
      expect(stage2?.children).toEqual(['integration-tests']);

      // Stage 3: e2e-tests
      const stage3 = groupNodes?.find((n) => n.label === 'Stage 3');
      expect(stage3?.children).toEqual(['e2e-tests']);
    });

    it('should create edges for all dependencies', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [],
        'test-b': [{ name: 'test-a', failFast: true }],
        'test-c': [
          { name: 'test-a', failFast: false },
          { name: 'test-b', failFast: false },
        ],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      expect(model.edges).toHaveLength(3);

      expect(model.edges).toContainEqual({
        id: 'test-a-to-test-b',
        type: TestGraphEdgeType.TEST_EDGE,
        source: 'test-a',
        target: 'test-b',
      });

      expect(model.edges).toContainEqual({
        id: 'test-a-to-test-c',
        type: TestGraphEdgeType.TEST_EDGE,
        source: 'test-a',
        target: 'test-c',
      });

      expect(model.edges).toContainEqual({
        id: 'test-b-to-test-c',
        type: TestGraphEdgeType.TEST_EDGE,
        source: 'test-b',
        target: 'test-c',
      });
    });

    it('should include failFast data in test nodes', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [],
        'test-b': [{ name: 'test-a', failFast: true }],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      // failFast on a dependency entry describes the named test (test-a):
      // if test-a fails, its dependents are skipped
      const testA = model.nodes?.find((n) => n.id === 'test-a');
      expect(testA?.data).toMatchObject({
        failFast: true,
        groupName: 'my-group',
      });
      const testB = model.nodes?.find((n) => n.id === 'test-b');
      expect(testB?.data?.failFast).toBe(false);
    });

    it('should handle empty test graph', () => {
      const testGraph: Record<string, TestGraphNode[]> = {};

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      expect(model.nodes).toHaveLength(0);
      expect(model.edges).toHaveLength(0);
    });

    it('should correctly calculate stages for complex DAG', () => {
      // Complex graph:
      //   A, B (Stage 1)
      //   C depends on A (Stage 2)
      //   D depends on B (Stage 2)
      //   E depends on C and D (Stage 3)
      const testGraph: Record<string, TestGraphNode[]> = {
        a: [],
        b: [],
        c: [{ name: 'a', failFast: false }],
        d: [{ name: 'b', failFast: false }],
        e: [
          { name: 'c', failFast: false },
          { name: 'd', failFast: false },
        ],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);
      expect(groupNodes).toHaveLength(3);

      const stage1 = groupNodes?.find((n) => n.label === 'Stage 1');
      expect(stage1?.children?.sort()).toEqual(['a', 'b']);

      const stage2 = groupNodes?.find((n) => n.label === 'Stage 2');
      expect(stage2?.children?.sort()).toEqual(['c', 'd']);

      const stage3 = groupNodes?.find((n) => n.label === 'Stage 3');
      expect(stage3?.children).toEqual(['e']);
    });

    it('should set correct node dimensions', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'my-test': [],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const testNode = model.nodes?.find((n) => n.type === TestGraphNodeType.TEST_NODE);
      expect(testNode?.width).toBe(180);
      expect(testNode?.height).toBe(32);
    });

    it('should set testgraph-visualization layout type', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        test: [],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      expect(model.graph?.layout).toBe('testgraph-visualization');
      expect(model.graph?.type).toBe('graph');
    });

    it('should handle multiple dependencies with mixed failFast values', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [],
        'test-b': [],
        'test-c': [
          { name: 'test-a', failFast: true },
          { name: 'test-b', failFast: false },
        ],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const testA = model.nodes?.find((n) => n.id === 'test-a');
      // test-c lists test-a with failFast: true — the flag belongs to test-a
      expect(testA?.data?.failFast).toBe(true);
      const testC = model.nodes?.find((n) => n.id === 'test-c');
      expect(testC?.data?.failFast).toBe(false);
    });

    it('should set failFast to false when no dependencies have it enabled', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [],
        'test-b': [],
        'test-c': [
          { name: 'test-a', failFast: false },
          { name: 'test-b', failFast: false },
        ],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const testC = model.nodes?.find((n) => n.id === 'test-c');
      expect(testC?.data?.failFast).toBe(false);
    });

    it('should handle wide parallel pattern (many tests converging to one gate)', () => {
      // 5 parallel tests in stage 1, all converge to deployment gate in stage 2
      const testGraph: Record<string, TestGraphNode[]> = {
        'smoke-tests': [],
        'unit-tests': [],
        'security-scan': [],
        'lint-check': [],
        'api-tests': [],
        'deployment-gate': [
          { name: 'smoke-tests', failFast: false },
          { name: 'unit-tests', failFast: true },
          { name: 'security-scan', failFast: true },
          { name: 'lint-check', failFast: false },
          { name: 'api-tests', failFast: false },
        ],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);
      expect(groupNodes).toHaveLength(2);

      // Stage 1: all 5 parallel tests
      const stage1 = groupNodes?.find((n) => n.label === 'Stage 1');
      expect(stage1?.children?.sort()).toEqual([
        'api-tests',
        'lint-check',
        'security-scan',
        'smoke-tests',
        'unit-tests',
      ]);

      // Stage 2: deployment gate
      const stage2 = groupNodes?.find((n) => n.label === 'Stage 2');
      expect(stage2?.children).toEqual(['deployment-gate']);

      // Deployment gate should have 5 incoming edges
      const gateEdges = model.edges?.filter((e) => e.target === 'deployment-gate');
      expect(gateEdges).toHaveLength(5);

      // The fail-fast tests are the ones the gate lists with failFast: true
      // (unit-tests, security-scan), not the gate itself
      expect(model.nodes?.find((n) => n.id === 'unit-tests')?.data?.failFast).toBe(true);
      expect(model.nodes?.find((n) => n.id === 'security-scan')?.data?.failFast).toBe(true);
      const gate = model.nodes?.find((n) => n.id === 'deployment-gate');
      expect(gate?.data?.failFast).toBe(false);
    });

    it('should handle deep chain pattern (6+ sequential stages)', () => {
      // Deep chain: lint → unit → integration → smoke → security → e2e → perf
      const testGraph: Record<string, TestGraphNode[]> = {
        lint: [],
        'unit-tests': [{ name: 'lint', failFast: false }],
        'integration-tests': [{ name: 'unit-tests', failFast: true }],
        'smoke-tests': [{ name: 'integration-tests', failFast: false }],
        'security-scan': [{ name: 'smoke-tests', failFast: true }],
        'e2e-tests': [{ name: 'security-scan', failFast: true }],
        'performance-tests': [{ name: 'e2e-tests', failFast: false }],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);
      expect(groupNodes).toHaveLength(7);

      // Verify all stages are correctly numbered
      expect(groupNodes?.find((n) => n.label === 'Stage 1')?.children).toEqual(['lint']);
      expect(groupNodes?.find((n) => n.label === 'Stage 2')?.children).toEqual(['unit-tests']);
      expect(groupNodes?.find((n) => n.label === 'Stage 3')?.children).toEqual([
        'integration-tests',
      ]);
      expect(groupNodes?.find((n) => n.label === 'Stage 4')?.children).toEqual(['smoke-tests']);
      expect(groupNodes?.find((n) => n.label === 'Stage 5')?.children).toEqual(['security-scan']);
      expect(groupNodes?.find((n) => n.label === 'Stage 6')?.children).toEqual(['e2e-tests']);
      expect(groupNodes?.find((n) => n.label === 'Stage 7')?.children).toEqual([
        'performance-tests',
      ]);

      // Verify edges form a chain
      expect(model.edges).toHaveLength(6);
      const expectedEdges = [
        { id: 'lint-to-unit-tests', source: 'lint', target: 'unit-tests' },
        {
          id: 'unit-tests-to-integration-tests',
          source: 'unit-tests',
          target: 'integration-tests',
        },
        {
          id: 'integration-tests-to-smoke-tests',
          source: 'integration-tests',
          target: 'smoke-tests',
        },
        { id: 'smoke-tests-to-security-scan', source: 'smoke-tests', target: 'security-scan' },
        { id: 'security-scan-to-e2e-tests', source: 'security-scan', target: 'e2e-tests' },
        { id: 'e2e-tests-to-performance-tests', source: 'e2e-tests', target: 'performance-tests' },
      ];
      expectedEdges.forEach((expected) => {
        expect(model.edges).toContainEqual({
          ...expected,
          type: TestGraphEdgeType.TEST_EDGE,
        });
      });
    });

    it('should handle cyclic dependencies without crashing', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [{ name: 'test-b', failFast: false }],
        'test-b': [{ name: 'test-a', failFast: false }],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const testNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.TEST_NODE);
      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);

      // Should not crash and should have both nodes
      expect(testNodes).toHaveLength(2);
      expect(groupNodes).toHaveLength(2); // Cycle creates 2 stages

      // Both nodes should be present
      expect(testNodes?.map((n) => n.id).sort()).toEqual(['test-a', 'test-b']);

      // Verify stage assignments: the second cycle member lands one stage
      // after the first (test-a is processed first, test-b breaks the cycle)
      const stage1 = groupNodes?.find((n) => n.label === 'Stage 1');
      const stage2 = groupNodes?.find((n) => n.label === 'Stage 2');
      expect(stage1?.children).toEqual(['test-b']);
      expect(stage2?.children).toEqual(['test-a']);

      // Should have edges for both dependencies
      expect(model.edges).toHaveLength(2);
      expect(model.edges?.map((e) => e.type)).toEqual([
        TestGraphEdgeType.TEST_EDGE,
        TestGraphEdgeType.TEST_EDGE,
      ]);
    });

    it('should place cyclic node after its non-cyclic dependencies', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [
          { name: 'test-b', failFast: false },
          { name: 'test-c', failFast: false },
        ],
        'test-b': [{ name: 'test-a', failFast: false }],
        'test-c': [],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);
      // test-c has no deps (stage 1), test-b cycles with test-a (stage 2),
      // test-a depends on both and must not be locked at stage 0
      expect(groupNodes?.find((n) => n.label === 'Stage 1')?.children).toEqual(['test-c']);
      expect(groupNodes?.find((n) => n.label === 'Stage 2')?.children).toEqual(['test-b']);
      expect(groupNodes?.find((n) => n.label === 'Stage 3')?.children).toEqual(['test-a']);
    });

    it('should handle missing dependency references', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [{ name: 'nonexistent-test', failFast: false }],
        'test-b': [],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      const testNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.TEST_NODE);
      const groupNodes = model.nodes?.filter((n) => n.type === TestGraphNodeType.GROUP);

      // Should have both test nodes
      expect(testNodes).toHaveLength(2);

      // Both at stage 0 (no valid dependencies)
      expect(groupNodes).toHaveLength(1);
      const stage1 = groupNodes?.[0];
      expect(stage1?.label).toBe('Stage 1');
      expect(stage1?.children?.sort()).toEqual(['test-a', 'test-b']);

      // No edges to nonexistent test
      expect(model.edges).toHaveLength(0);
    });

    it('should ignore inherited dependency names', () => {
      const testGraph: Record<string, TestGraphNode[]> = {
        'test-a': [{ name: 'constructor' }, { name: 'toString' }],
      };

      const model = getTestGraphModel(testGraph, 'my-group', 'test-ns');

      expect(model.edges).toHaveLength(0);
      expect(model.nodes?.find((node) => node.id === 'test-a')).toBeDefined();
    });

    it('should keep stage group ids distinct from test names', () => {
      const model = getTestGraphModel({ 'stage-0': [] }, 'my-group', 'test-ns');

      expect(model.nodes?.map((node) => node.id)).toEqual(['stage:0', 'stage-0']);
    });
  });
});
