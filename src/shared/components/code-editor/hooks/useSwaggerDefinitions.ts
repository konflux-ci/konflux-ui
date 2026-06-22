import { queryOptions, useQuery } from '@tanstack/react-query';
import { commonFetch } from '~/k8s';
import { logger } from '~/monitoring/logger';
import { OpenAPISchemaDefinitions } from '../types';

const SWAGGER_QUERY_KEY = 'swagger';

const fetchSwaggerDefinitions = async (): Promise<OpenAPISchemaDefinitions | null> => {
  try {
    const response = await commonFetch('/openapi/v2');
    const data = await response.json();
    if (!data?.definitions) {
      logger.error('Definitions missing in OpenAPI response.');
      return null;
    }
    return data.definitions as OpenAPISchemaDefinitions;
  } catch (e) {
    logger.error('Could not get OpenAPI definitions', e instanceof Error ? e : undefined);
    return null;
  }
};

export const useSwaggerDefinitions = () =>
  useQuery<OpenAPISchemaDefinitions | null>(
    queryOptions({
      queryKey: [SWAGGER_QUERY_KEY],
      queryFn: fetchSwaggerDefinitions,
      staleTime: Infinity,
    }),
  );
