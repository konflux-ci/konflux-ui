import {
  convertFilterToKubearchiveSelectors,
  PipelineRunSelector,
} from '../pipeline-run-filter-transform';

describe('convertFilterToKubearchiveSelectors', () => {
  it('should return empty selector when no filters are provided', () => {
    const filterBy: PipelineRunSelector = {};
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result).toEqual({
      selector: { matchExpressions: [] },
      fieldSelector: undefined,
    });
  });

  it('should apply name filtering via field selector', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: 'e2e',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBe('name=*e2e*');
    expect(result.selector).toEqual({
      filterByName: 'e2e',
      matchLabels: undefined,
      matchExpressions: [],
    });
  });

  it('should apply creation timestamp filtering via field selector', () => {
    const filterBy: PipelineRunSelector = {
      filterByCreationTimestampAfter: '2023-01-01T12:00:00Z',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBe('creationTimestampAfter=2023-01-01T12:00:00Z');
    expect(result.selector).toEqual({
      filterByCreationTimestampAfter: '2023-01-01T12:00:00Z',
      matchLabels: undefined,
      matchExpressions: [],
    });
  });

  it('should combine multiple field selectors with comma', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: 'test',
      filterByCreationTimestampAfter: '2023-01-01T12:00:00Z',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBe('name=*test*,creationTimestampAfter=2023-01-01T12:00:00Z');
    expect(result.selector).toEqual({
      filterByName: 'test',
      filterByCreationTimestampAfter: '2023-01-01T12:00:00Z',
      matchLabels: undefined,
      matchExpressions: [],
    });
  });

  it('should preserve matchLabels in the selector', () => {
    const filterBy: PipelineRunSelector = {
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
      matchExpressions: [],
    });
    expect(result.fieldSelector).toBeUndefined();
  });

  it('should preserve matchExpressions in the selector', () => {
    const filterBy: PipelineRunSelector = {
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
    const filterBy: PipelineRunSelector = {
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
    const filterBy: PipelineRunSelector = {
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
    });
  });

  it('should handle empty string values', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: '',
      filterByCreationTimestampAfter: '',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBeUndefined();
    expect(result.selector).toEqual({
      filterByName: '',
      filterByCreationTimestampAfter: '',
      matchLabels: undefined,
      matchExpressions: [],
    });
  });

  it('should wrap name filter with wildcards', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: 'my-pipeline',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBe('name=*my-pipeline*');
  });

  it('should handle special characters in name filter', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: 'test-app.v1',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBe('name=*test-app.v1*');
  });

  it('should preserve additional properties in selector', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: 'test',
      matchLabels: {
        app: 'myapp',
      },
      someOtherProp: 'value',
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.fieldSelector).toBe('name=*test*');
    expect(result.selector).toEqual({
      filterByName: 'test',
      matchLabels: {
        app: 'myapp',
      },
      matchExpressions: [],
      someOtherProp: 'value',
    });
  });

  it('should handle undefined matchExpressions', () => {
    const filterBy: PipelineRunSelector = {
      filterByName: 'test',
      matchExpressions: undefined,
    };
    const result = convertFilterToKubearchiveSelectors(filterBy);

    expect(result.selector?.matchExpressions).toEqual([]);
  });
});
