import { PipelineRunLabel } from '~/consts/pipelinerun';
import { createEquals } from '~/k8s/k8s-utils';
import { MatchExpression, MatchLabels, Selector } from '~/types/k8s';
import {
  convertFilterToKubearchiveSelectors,
  createKubearchiveWatchResource,
} from '../task-run-filter-transforms';

describe('task-run-filter-transforms', () => {
  describe('convertFilterToKubearchiveSelectors', () => {
    it('should convert filterByName to field selector', () => {
      const result = convertFilterToKubearchiveSelectors({
        filterByName: 'my-task-run',
      });

      expect(result.fieldSelector).toEqual('metadata.name=my-task-run');
    });

    it('should not create field selectors for filterByCreationTimestampAfter', () => {
      const timestamp = '2024-01-01T00:00:00Z';
      const result = convertFilterToKubearchiveSelectors({
        filterByCreationTimestampAfter: timestamp,
      });

      expect(result.fieldSelector).toBeUndefined();
    });

    it('should handle multiple field selectors, excluding timestamp', () => {
      const result = convertFilterToKubearchiveSelectors({
        filterByName: 'my-task-run',
        filterByCreationTimestampAfter: '2024-01-01T00:00:00Z',
      });

      expect(result.fieldSelector).toEqual('metadata.name=my-task-run');
    });

    it('should preserve matchLabels', () => {
      const matchLabels: MatchLabels = {
        'tekton.dev/pipelineRun': 'test-pr',
        'tekton.dev/task': 'test-task',
      };

      const result = convertFilterToKubearchiveSelectors({
        matchLabels,
      });

      expect(result.selector.matchLabels).toEqual(matchLabels);
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

      expect(result.selector.matchExpressions).toEqual(matchExpressions);
    });

    it('should convert filterByCommit to match expression', () => {
      const commitSha = 'abc123def456';
      const result = convertFilterToKubearchiveSelectors({
        filterByCommit: commitSha,
      });

      expect(result.selector.matchExpressions).toEqual([
        createEquals(PipelineRunLabel.COMMIT_LABEL, commitSha),
      ]);
    });

    it('should combine existing matchExpressions with commit expression', () => {
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

      expect(result.selector.matchExpressions).toHaveLength(2); // 1 existing + 1 commit expression
      expect(result.selector.matchExpressions[0]).toEqual(existingExpressions[0]);
      expect(result.selector.matchExpressions[1]).toEqual(
        createEquals(PipelineRunLabel.COMMIT_LABEL, 'abc123'),
      );
    });

    it('should handle empty input', () => {
      const result = convertFilterToKubearchiveSelectors({});
      expect(result).toEqual({
        fieldSelector: undefined,
        selector: {
          matchLabels: undefined,
          matchExpressions: [],
        },
      });
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
      expect(result.fieldSelector).toBe('metadata.name=my-task-run');
      expect(result.selector).toEqual({
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        matchExpressions: [],
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
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        matchExpressions: [],
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
