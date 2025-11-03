import { PipelineRunLabel } from '~/consts/pipelinerun';
import { createEquals } from '~/k8s/k8s-utils';
import { MatchExpression, MatchLabels } from '~/types/k8s';
import {
  convertFilterToKubearchiveSelectors,
  createKubearchiveWatchResource,
  KubearchiveFilterTransformSelector,
} from '../kubearchive-filter-transform';

describe('task-run-filter-transforms', () => {
  describe('convertFilterToKubearchiveSelectors', () => {
    it('should convert filterByName to field selector', () => {
      const result = convertFilterToKubearchiveSelectors({
        filterByName: 'my-task-run',
      });

      expect(result.fieldSelector).toEqual('name=*my-task-run*');
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
        },
      });
    });

    it('should apply creation timestamp filtering via field selector', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByCreationTimestampAfter: '2023-01-01T12:00:00Z',
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBe('creationTimestampAfter=2023-01-01T12:00:00Z');
      expect(result.selector).toEqual({
        matchLabels: undefined,
      });
    });

    it('should combine multiple field selectors with comma', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: 'test',
        filterByCreationTimestampAfter: '2023-01-01T12:00:00Z',
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBe('name=*test*,creationTimestampAfter=2023-01-01T12:00:00Z');
      expect(result.selector).toEqual({
        matchLabels: undefined,
      });
    });

    it('should preserve matchLabels in the selector', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        matchLabels: {
          'app.kubernetes.io/name': 'my-app',
          environment: 'production',
        },
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.selector).toEqual({
        matchLabels: {
          'app.kubernetes.io/name': 'my-app',
          environment: 'production',
        },
      });
      expect(result.fieldSelector).toBeUndefined();
    });

    it('should preserve matchExpressions in the selector', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        matchExpressions: [
          {
            key: 'app',
            operator: 'In',
            values: ['frontend', 'backend'],
          },
        ],
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.selector).toEqual({
        matchExpressions: [
          {
            key: 'app',
            operator: 'In',
            values: ['frontend', 'backend'],
          },
        ],
      });
      expect(result.fieldSelector).toBeUndefined();
    });

    it('should handle multiple matchExpressions', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        matchExpressions: [
          {
            key: 'app',
            operator: 'In',
            values: ['frontend', 'backend'],
          },
          {
            key: 'version',
            operator: 'NotIn',
            values: ['v1'],
          },
        ],
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.selector?.matchExpressions).toHaveLength(2);
      expect(result.selector?.matchExpressions).toEqual([
        {
          key: 'app',
          operator: 'In',
          values: ['frontend', 'backend'],
        },
        {
          key: 'version',
          operator: 'NotIn',
          values: ['v1'],
        },
      ]);
    });

    it('should combine all filter types together', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: 'integration',
        filterByCreationTimestampAfter: '2024-01-01T00:00:00Z',
        matchLabels: {
          team: 'platform',
        },
        matchExpressions: [
          {
            key: 'status',
            operator: 'Exists',
          },
        ],
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBe(
        'name=*integration*,creationTimestampAfter=2024-01-01T00:00:00Z',
      );
      expect(result.selector).toEqual({
        matchLabels: {
          team: 'platform',
        },
        matchExpressions: [
          {
            key: 'status',
            operator: 'Exists',
          },
        ],
      });
    });

    it('should handle empty string values', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: '',
        filterByCreationTimestampAfter: '',
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBeUndefined();
      expect(result.selector).toEqual({
        matchLabels: undefined,
      });
    });

    it('should wrap name filter with wildcards', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: 'my-pipeline',
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBe('name=*my-pipeline*');
    });

    it('should handle special characters in name filter', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: 'test-app.v1',
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBe('name=*test-app.v1*');
    });

    it('should preserve additional properties in selector', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: 'test',
        matchLabels: {
          app: 'myapp',
        },
        someOtherProp: 'value',
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.fieldSelector).toBe('name=*test*');
      expect(result.selector).toEqual({
        matchLabels: {
          app: 'myapp',
        },
        someOtherProp: 'value',
      });
    });

    it('should handle undefined matchExpressions', () => {
      const filterBy: KubearchiveFilterTransformSelector = {
        filterByName: 'test',
        matchExpressions: undefined,
      };
      const result = convertFilterToKubearchiveSelectors(filterBy);

      expect(result.selector?.matchExpressions).toBeUndefined();
    });
  });

  describe('createKubearchiveWatchResource', () => {
    it('should create watch resource with field selectors', () => {
      const selector: KubearchiveFilterTransformSelector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
        filterByName: 'my-task-run',
        filterByCreationTimestampAfter: '2024-01-01T00:00:00Z',
      };

      const result = createKubearchiveWatchResource('default', selector);

      expect(result.namespace).toBe('default');
      expect(result.fieldSelector).toBe(
        'name=*my-task-run*,creationTimestampAfter=2024-01-01T00:00:00Z',
      );
      expect(result.selector).toEqual({
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
      });
    });

    it('should handle selector with only labels', () => {
      const selector: KubearchiveFilterTransformSelector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
      };

      const result = createKubearchiveWatchResource('default', selector);

      expect(result.namespace).toBe('default');
      expect(result.fieldSelector).toBeUndefined();
      expect(result.selector).toEqual({
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
      });
    });

    it('should handle no selector', () => {
      const result = createKubearchiveWatchResource('default');

      expect(result).toEqual({
        namespace: 'default',
      });
    });

    it('should handle empty field selectors', () => {
      const selector: KubearchiveFilterTransformSelector = {
        matchLabels: { 'tekton.dev/pipelineRun': 'test-pr' },
      };

      const result = createKubearchiveWatchResource('default', selector);

      expect(result.fieldSelector).toBeUndefined();
    });
  });
});
