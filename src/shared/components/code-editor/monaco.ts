import type { Monaco } from '@monaco-editor/react';
import { configureMonacoYaml } from 'monaco-yaml';
import { logger } from '~/monitoring/logger';
import { openAPItoJSONSchema } from './openapi-to-json-schema';
import { OpenAPISchemaDefinitions } from './types';

let yamlRegistered = false;

export const registerYAMLinMonaco = (
  monacoInstance: Monaco,
  swaggerDefinitions: OpenAPISchemaDefinitions,
) => {
  if (!monacoInstance) {
    logger.warn('registerYAMLinMonaco: monacoInstance is undefined');
    return;
  }

  if (yamlRegistered) return;
  yamlRegistered = true;

  const kubernetesJSONSchema = openAPItoJSONSchema(swaggerDefinitions);

  const schemas = [
    {
      uri: 'inmemory:yaml',
      fileMatch: ['*'],
      schema: kubernetesJSONSchema,
    },
  ];

  configureMonacoYaml(monacoInstance, {
    isKubernetes: true,
    validate: true,
    schemas,
    hover: true,
    completion: true,
  });
};
