import type { Monaco } from '@monaco-editor/react';
import { configureMonacoYaml } from 'monaco-yaml';
import { openAPItoJSONSchema } from './openapi-to-json-schema';
import { OpenAPISchemaDefinitions } from './types';

export const registerYAMLinMonaco = (
  monacoInstance: Monaco,
  swaggerDefinitions: OpenAPISchemaDefinitions,
) => {
  if (!monacoInstance) {
    // eslint-disable-next-line no-console
    console.warn('registerYAMLinMonaco: monacoInstance is undefined');
    return;
  }

  /**
   * This exists because we enabled globalAPI in the webpack config. This means that the
   * the monaco instance may have already been setup with the YAML language features.
   * Otherwise, we might register all the features again, getting duplicate results.
   *
   * Monaco does not provide any APIs for unregistering or checking if the features have already
   * been registered for a language.
   *
   * We check that > 1 YAML language exists because one is the default and
   * the other is the language server that we register.
   */
  if ((monacoInstance.languages?.getLanguages() ?? []).filter((x) => x.id === 'yaml').length <= 1) {
    // Convert the openAPI schema to something the language server understands
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
  }
};
