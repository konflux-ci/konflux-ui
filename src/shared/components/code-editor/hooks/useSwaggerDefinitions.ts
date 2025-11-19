import { queryOptions, useQuery } from '@tanstack/react-query';
import { commonFetch } from '../../../../k8s';
import { OpenAPISchemaDefinitions } from '../types';

const SWAGGER_QUERY_KEY = 'swagger';

const fetchSwaggerDefinitions = async (): Promise<OpenAPISchemaDefinitions | null> => {
  try {
    const response = await commonFetch('/openapi/v2');
    const data = await response.json();
    if (!data?.definitions) {
      // eslint-disable-next-line no-console
      console.error('Definitions missing in OpenAPI response.');
      return null;
    }
    return data.definitions as OpenAPISchemaDefinitions;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not get OpenAPI definitions', e);
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
