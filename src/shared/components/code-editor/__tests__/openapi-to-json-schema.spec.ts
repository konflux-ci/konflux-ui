import { openAPItoJSONSchema } from '../openapi-to-json-schema';

describe('openAPItoJSONSchema', () => {
  it('should return null when openAPI is null', () => {
    expect(openAPItoJSONSchema(null)).toBeNull();
  });

  it('should return null when openAPI is undefined', () => {
    expect(openAPItoJSONSchema(undefined)).toBeNull();
  });

  it('should convert simple OpenAPI definitions to JSON Schema', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result).toEqual({
      definitions: {
        'io.k8s.api.core.v1.Pod': {
          type: 'object',
          properties: {
            metadata: { type: 'object' },
          },
        },
      },
      oneOf: [
        {
          $ref: '#/definitions/io.k8s.api.core.v1.Pod',
        },
      ],
    });
  });

  it('should convert multiple OpenAPI definitions to JSON Schema', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
      },
      'io.k8s.api.core.v1.Service': {
        type: 'object',
        properties: {
          spec: { type: 'object' },
        },
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod']).toBeDefined();
    expect(result?.definitions['io.k8s.api.core.v1.Service']).toBeDefined();
    expect(result?.oneOf).toHaveLength(2);
    expect(result?.oneOf).toContainEqual({ $ref: '#/definitions/io.k8s.api.core.v1.Pod' });
    expect(result?.oneOf).toContainEqual({ $ref: '#/definitions/io.k8s.api.core.v1.Service' });
  });

  it('should convert GroupVersionKind annotations to JSON Schema enums', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion).toEqual({
      enum: ['v1'],
    });
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind).toEqual({
      enum: ['Pod'],
    });
  });

  it('should handle GroupVersionKind with group and version', () => {
    const openAPI = {
      'io.k8s.api.apps.v1.Deployment': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: 'apps',
            version: 'v1',
            kind: 'Deployment',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.apps.v1.Deployment'].properties.apiVersion).toEqual({
      enum: ['apps/v1'],
    });
    expect(result?.definitions['io.k8s.api.apps.v1.Deployment'].properties.kind).toEqual({
      enum: ['Deployment'],
    });
  });

  it('should append to existing apiVersion enum', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          apiVersion: {
            enum: ['v1'],
          },
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: 'apps',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toContain(
      'v1',
    );
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toContain(
      'apps/v1',
    );
  });

  it('should append to existing kind enum', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          kind: {
            enum: ['Pod'],
          },
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Service',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toContain('Pod');
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toContain('Service');
  });

  it('should handle GroupVersionKind with only version (no group)', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toEqual([
      'v1',
    ]);
  });

  it('should handle multiple GroupVersionKind entries', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
          {
            group: 'apps',
            version: 'v1',
            kind: 'Deployment',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toContain(
      'v1',
    );
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toContain(
      'apps/v1',
    );
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toContain('Pod');
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toContain(
      'Deployment',
    );
  });

  it('should skip definitions without properties when converting GVK', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    // Should not add apiVersion/kind if properties don't exist
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties).toBeUndefined();
  });

  it('should skip definitions without x-kubernetes-group-version-kind', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod']).toEqual({
      type: 'object',
      properties: {
        metadata: { type: 'object' },
      },
    });
  });

  it('should handle empty OpenAPI object', () => {
    const openAPI = {};

    const result = openAPItoJSONSchema(openAPI);

    expect(result).toEqual({
      definitions: {},
      oneOf: [],
    });
  });

  it('should handle GroupVersionKind with only version (no group, no kind)', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: '',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toEqual([
      'v1',
    ]);
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind).toEqual({
      enum: [],
    });
  });

  it('should handle apiVersion without existing enum property', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toEqual([
      'v1',
    ]);
  });

  it('should handle kind without existing enum property', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
          },
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toEqual(['Pod']);
  });

  it('should handle GroupVersionKind with group but no version', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: 'apps',
            version: '',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion).toEqual({
      enum: [],
    });
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toEqual(['Pod']);
  });

  it('should execute createOrAppendAPIVersion when apiVersion exists', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          apiVersion: {
            type: 'string',
          },
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion).toBeDefined();
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.apiVersion.enum).toEqual([
      'v1',
    ]);
  });

  it('should execute createOrAppendKind when kind exists', () => {
    const openAPI = {
      'io.k8s.api.core.v1.Pod': {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
          },
          metadata: { type: 'object' },
        },
        'x-kubernetes-group-version-kind': [
          {
            group: '',
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
    };

    const result = openAPItoJSONSchema(openAPI);

    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind).toBeDefined();
    expect(result?.definitions['io.k8s.api.core.v1.Pod'].properties.kind.enum).toEqual(['Pod']);
  });
});
