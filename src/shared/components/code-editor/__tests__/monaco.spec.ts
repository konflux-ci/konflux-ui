import { OpenAPISchemaDefinitions } from '../types';

const mockConfigureMonacoYaml = jest.fn();

jest.mock('monaco-yaml', () => ({
  configureMonacoYaml: (...args: unknown[]) => mockConfigureMonacoYaml(...args),
}));

jest.mock('../openapi-to-json-schema', () => ({
  openAPItoJSONSchema: jest.fn(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

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

const createMockMonaco = () =>
  ({
    languages: {
      getLanguages: jest.fn().mockReturnValue([{ id: 'yaml' }]),
    },
  }) as unknown as typeof import('monaco-editor/esm/vs/editor/editor.api');

describe('registerYAMLinMonaco', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const loadFreshModule = () => {
    const result = {} as {
      registerYAMLinMonaco: typeof import('../monaco').registerYAMLinMonaco;
      openAPItoJSONSchema: jest.Mock;
      logger: { warn: jest.Mock };
    };

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const monacoModule = require('../monaco');
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const schemaModule = require('../openapi-to-json-schema');
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const loggerModule = require('~/monitoring/logger');
      result.registerYAMLinMonaco = monacoModule.registerYAMLinMonaco;
      result.openAPItoJSONSchema = schemaModule.openAPItoJSONSchema;
      result.logger = loggerModule.logger;
    });

    return result;
  };

  it('should warn and return early when monacoInstance is undefined', () => {
    const { registerYAMLinMonaco, logger } = loadFreshModule();

    registerYAMLinMonaco(undefined, mockSwaggerDefinitions);

    expect(logger.warn).toHaveBeenCalledWith('registerYAMLinMonaco: monacoInstance is undefined');
    expect(mockConfigureMonacoYaml).not.toHaveBeenCalled();
  });

  it('should warn and return early when monacoInstance is null', () => {
    const { registerYAMLinMonaco, logger } = loadFreshModule();

    registerYAMLinMonaco(null, mockSwaggerDefinitions);

    expect(logger.warn).toHaveBeenCalledWith('registerYAMLinMonaco: monacoInstance is undefined');
    expect(mockConfigureMonacoYaml).not.toHaveBeenCalled();
  });

  it('should register YAML schema on first call', () => {
    const { registerYAMLinMonaco, openAPItoJSONSchema } = loadFreshModule();
    openAPItoJSONSchema.mockReturnValue(mockJSONSchema);
    const mockMonaco = createMockMonaco();

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);

    expect(openAPItoJSONSchema).toHaveBeenCalledWith(mockSwaggerDefinitions);
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

  it('should not register YAML schema on subsequent calls', () => {
    const { registerYAMLinMonaco, openAPItoJSONSchema } = loadFreshModule();
    openAPItoJSONSchema.mockReturnValue(mockJSONSchema);
    const mockMonaco = createMockMonaco();

    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);
    expect(mockConfigureMonacoYaml).toHaveBeenCalledTimes(1);

    mockConfigureMonacoYaml.mockClear();
    registerYAMLinMonaco(mockMonaco, mockSwaggerDefinitions);
    expect(mockConfigureMonacoYaml).not.toHaveBeenCalled();
  });
});
