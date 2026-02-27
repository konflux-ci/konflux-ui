/* eslint-disable no-console */
import { registerYAMLinMonaco } from '../monaco';
import { openAPItoJSONSchema } from '../openapi-to-json-schema';
import { OpenAPISchemaDefinitions } from '../types';

const mockConfigureMonacoYaml = jest.fn();

jest.mock('monaco-yaml', () => ({
  configureMonacoYaml: (...args: unknown[]) => mockConfigureMonacoYaml(...args),
}));

jest.mock('../openapi-to-json-schema', () => ({
  openAPItoJSONSchema: jest.fn(),
}));

const mockOpenAPItoJSONSchema = openAPItoJSONSchema as jest.MockedFunction<
  typeof openAPItoJSONSchema
>;

describe('registerYAMLinMonaco', () => {
  const mockSwaggerDefinitions: OpenAPISchemaDefinitions = {
    'io.k8s.api.core.v1.Pod': {
      type: 'object',
      properties: {
        metadata: { type: 'object' },
      },
    },
  };

  const mockJSONSchema = {
    definitions: {
      Pod: {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
        },
      },
    },
    oneOf: [{ $ref: '#/definitions/Pod' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = jest.fn();
    mockOpenAPItoJSONSchema.mockReturnValue(mockJSONSchema);
  });

  it('should warn and return early when monacoInstance is undefined', () => {
    registerYAMLinMonaco(undefined, mockSwaggerDefinitions);

    expect(console.warn).toHaveBeenCalledWith('registerYAMLinMonaco: monacoInstance is undefined');
    expect(mockConfigureMonacoYaml).not.toHaveBeenCalled();
  });

  it('should warn and return early when monacoInstance is null', () => {
    registerYAMLinMonaco(null, mockSwaggerDefinitions);

    expect(console.warn).toHaveBeenCalledWith('registerYAMLinMonaco: monacoInstance is undefined');
    expect(mockConfigureMonacoYaml).not.toHaveBeenCalled();
  });

  it('should not register YAML when already registered (more than 1 YAML language)', () => {
    const mockMonaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue([
          { id: 'yaml' },
          { id: 'yaml' }, // duplicate YAML language
          { id: 'json' },
        ]),
      },
    } as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);

    expect(mockConfigureMonacoYaml).not.toHaveBeenCalled();
  });

  it('should register YAML when not already registered (exactly 1 YAML language)', () => {
    const mockMonaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue([
          { id: 'yaml' }, // only default YAML
          { id: 'json' },
        ]),
      },
    } as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);

    expect(mockOpenAPItoJSONSchema).toHaveBeenCalledWith(mockSwaggerDefinitions);
    expect(mockConfigureMonacoYaml).toHaveBeenCalledWith(mockMonaco, {
      isKubernetes: true,
      validate: true,
      schemas: [
        {
          uri: 'inmemory:yaml',
          fileMatch: ['*'],
          schema: mockJSONSchema,
        },
      ],
      hover: true,
      completion: true,
    });
  });

  it('should register YAML when no YAML language exists', () => {
    const mockMonaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue([{ id: 'json' }]),
      },
    } as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);

    expect(mockConfigureMonacoYaml).toHaveBeenCalled();
  });

  it('should handle empty languages array', () => {
    const mockMonaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue([]),
      },
    } as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);

    expect(mockConfigureMonacoYaml).toHaveBeenCalled();
  });

  it('should handle when languages.getLanguages returns undefined', () => {
    const mockMonaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue(undefined),
      },
    } as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

    // should treat undefined as empty array and register YAML
    expect(() => {
      registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);
    }).not.toThrow();
    expect(mockConfigureMonacoYaml).toHaveBeenCalled();
  });

  it('should convert swagger definitions to JSON schema before registering', () => {
    const mockMonaco = {
      languages: {
        getLanguages: jest.fn().mockReturnValue([{ id: 'json' }]),
      },
    } as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);

    expect(mockOpenAPItoJSONSchema).toHaveBeenCalledWith(mockSwaggerDefinitions);
    expect(mockConfigureMonacoYaml).toHaveBeenCalledWith(
      mockMonaco,
      expect.objectContaining({
        schemas: [
          expect.objectContaining({
            schema: mockJSONSchema,
          }),
        ],
      }),
    );
  });
});
