import { MatchExpression, MatchLabels, Selector } from '~/types/k8s';
import {
  convertFilterToKubearchiveSelectors,
  convertKubearchiveSelectorsToFilter,
  createKubearchiveSelector,
  createKubearchiveWatchResource,
} from '../task-run-filter-transforms';

describe('task-run-filter-transforms', () => {
  describe('convertFilterToKubearchiveSelectors', () => {
    it('should convert filterByName to field selector', () => {
      const result = convertFilterToKubearchiveSelectors({
        filterByName: 'my-task-run',
      });

      expect(result.fieldSelectors).toEqual({
        'metadata.name': 'my-task-run',
      });
    });

    it('should convert filterByCreationTimestampAfter to field selector', () => {
      const timestamp = '2024-01-01T00:00:00Z';
      const result = convertFilterToKubearchiveSelectors({
        filterByCreationTimestampAfter: timestamp,
      });

      expect(result.fieldSelectors).toEqual({
        'metadata.creationTimestamp': `>${timestamp}`,
      });
    });

    it('should handle multiple field selectors', () => {
      const result = convertFilterToKubearchiveSelectors({
        filterByName: 'my-task-run',
        filterByCreationTimestampAfter: '2024-01-01T00:00:00Z',
      });

      expect(result.fieldSelectors).toEqual({
        'metadata.name': 'my-task-run',
        'metadata.creationTimestamp': '>2024-01-01T00:00:00Z',
      });
    });

    it('should preserve matchLabels', () => {
      const matchLabels: MatchLabels = {
        'tekton.dev/pipelineRun': 'test-pr',
        'tekton.dev/task': 'test-task',
      };

      const result = convertFilterToKubearchiveSelectors({
        matchLabels,
      });

      expect(result.matchLabels).toEqual(matchLabels);
    });

    it('should preserve matchExpressions', () => {
      const matchExpressions: MatchExpression[] = [
        {
          key: 'tekton.dev/pipelineRun',
          operator: 'In',
          values: ['test-pr-1', 'test-pr-2'],
        },
      ];

      const result = convertFilterToKubearchiveSelectors({
        matchExpressions,
      });

      expect(result.matchExpressions).toEqual(matchExpressions);
    });

    it('should convert filterByCommit to match expressions', () => {
      const commitSha = 'abc123def456';
      const result = convertFilterToKubearchiveSelectors({
        filterByCommit: commitSha,
      });

      expect(result.matchExpressions).toEqual([
        {
          key: 'pipelinesascode.tekton.dev/sha',
          operator: 'In',
          values: [commitSha],
        },
        {
          key: 'tekton.dev/pipeline',
          operator: 'In',
          values: [commitSha],
        },
        {
          key: 'appstudio.openshift.io/commit',
          operator: 'In',
          values: [commitSha],
        },
      ]);
    });

    it('should combine existing matchExpressions with commit expressions', () => {
      const existingExpressions: MatchExpression[] = [
        {
          key: 'custom.label',
          operator: 'Exists',
        },
      ];

      const result = convertFilterToKubearchiveSelectors({
        matchExpressions: existingExpressions,
        filterByCommit: 'abc123',
      });

      expect(result.matchExpressions).toHaveLength(4); // 1 existing + 3 commit expressions
      expect(result.matchExpressions[0]).toEqual(existingExpressions[0]);
      expect(result.matchExpressions.slice(1)).toEqual([
        {
          key: 'pipelinesascode.tekton.dev/sha',
          operator: 'In',
          values: ['abc123'],
        },
        {
          key: 'tekton.dev/pipeline',
          operator: 'In',
          values: ['abc123'],
        },
        {
          key: 'appstudio.openshift.io/commit',
          operator: 'In',
          values: ['abc123'],
        },
      ]);
    });

    it('should handle empty input', () => {
      const result = convertFilterToKubearchiveSelectors({});
      expect(result).toEqual({});
    });
  });

  describe('convertKubearchiveSelectorsToFilter', () => {
    it('should convert field selectors back to filter format', () => {
      const result = convertKubearchiveSelectorsToFilter({
        fieldSelectors: {
          'metadata.name': 'my-task-run',
          'metadata.creationTimestamp': '>2024-01-01T00:00:00Z',
        },
      });

      expect(result).toEqual({
        filterByName: 'my-task-run',
        filterByCreationTimestampAfter: '2024-01-01T00:00:00Z',
      });
    });

    it('should preserve matchLabels and matchExpressions', () => {
      const matchLabels: MatchLabels = { 'tekton.dev/pipelineRun': 'test-pr' };
      const matchExpressions: MatchExpression[] = [
        { key: 'tekton.dev/task', operator: 'In', values: ['task1', 'task2'] },
      ];

      const result = convertKubearchiveSelectorsToFilter({
        matchLabels,
        matchExpressions,
      });

      expect(result.matchLabels).toEqual(matchLabels);
      expect(result.matchExpressions).toEqual(matchExpressions);
    });

    it('should handle creation timestamp without > prefix', () => {
      const result = convertKubearchiveSelectorsToFilter({
        fieldSelectors: {
          'metadata.creationTimestamp': '2024-01-01T00:00:00Z',
        },
      });

      expect(result.filterByCreationTimestampAfter).toBeUndefined();
    });

    it('should handle empty input', () => {
      const result = convertKubearchiveSelectorsToFilter({});
      expect(result).toEqual({});
    });
  });

  describe('createKubearchiveSelector', () => {
    it('should create kubearchive selector from standard selector', () => {
      const selector: Selector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        filterByName: 'my-task-run',
        filterByCommit: 'abc123',
      };

      const result = createKubearchiveSelector(selector);

      expect(result).toEqual({
        ...selector,
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        matchExpressions: [
          {
            key: 'pipelinesascode.tekton.dev/sha',
            operator: 'In',
            values: ['abc123'],
          },
          {
            key: 'tekton.dev/pipeline',
            operator: 'In',
            values: ['abc123'],
          },
          {
            key: 'appstudio.openshift.io/commit',
            operator: 'In',
            values: ['abc123'],
          },
        ],
        filterByName: undefined,
        filterByCreationTimestampAfter: undefined,
        filterByCommit: undefined,
      });
    });

    it('should return undefined for undefined selector', () => {
      const result = createKubearchiveSelector(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('createKubearchiveWatchResource', () => {
    it('should create watch resource with field selectors', () => {
      const selector: Selector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        filterByName: 'my-task-run',
        filterByCreationTimestampAfter: '2024-01-01T00:00:00Z',
      };

      const result = createKubearchiveWatchResource('default', selector);

      expect(result.namespace).toBe('default');
      expect(result.fieldSelector).toBe(
        'metadata.name=my-task-run,metadata.creationTimestamp=>2024-01-01T00:00:00Z',
      );
      expect(result.selector).toEqual({
        ...selector,
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        filterByName: undefined,
        filterByCreationTimestampAfter: undefined,
        filterByCommit: undefined,
      });
    });

    it('should handle selector with only labels', () => {
      const selector: Selector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
      };

      const result = createKubearchiveWatchResource('default', selector);

      expect(result.namespace).toBe('default');
      expect(result.fieldSelector).toBeUndefined();
      expect(result.selector).toEqual({
        ...selector,
        filterByName: undefined,
        filterByCreationTimestampAfter: undefined,
        filterByCommit: undefined,
      });
    });

    it('should handle no selector', () => {
      const result = createKubearchiveWatchResource('default');

      expect(result).toEqual({
        namespace: 'default',
      });
    });

    it('should handle empty field selectors', () => {
      const selector: Selector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
      };

      const result = createKubearchiveWatchResource('default', selector);

      expect(result.fieldSelector).toBeUndefined();
    });
  });
});
