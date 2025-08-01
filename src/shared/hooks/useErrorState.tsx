import { Alert } from '@patternfly/react-core';
import { HttpError } from '~/k8s/error';
import ErrorEmptyState from '../components/empty-state/ErrorEmptyState';

export const useErrorState = (
  error: unknown,
  loaded: boolean,
  resourceName: string = 'data',
  isAlert: boolean = false,
) => {
  if (loaded && error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code: number }).code
        : undefined;
    const httpError = errorCode ? HttpError.fromCode(errorCode) : undefined;

    return isAlert ? (
      <Alert variant="danger" isInline title={`Unable to load ${resourceName}`} />
    ) : (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load ${resourceName}`}
        body={httpError?.message || 'Something went wrong'}
      />
    );
  }

  return null;
};
