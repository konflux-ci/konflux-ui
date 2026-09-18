import { Alert } from '@patternfly/react-core';
import { HttpError } from '~/k8s/error';
import ErrorEmptyState from '../components/empty-state/ErrorEmptyState';

export const getErrorState = (
  error: unknown,
  loaded: boolean,
  resourceName: string = 'data',
  isAlert: boolean = false,
  contextMessages?: Partial<Record<number, string>>,
) => {
  if (loaded && error) {
    const errorCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'number'
        ? error.code
        : undefined;
    const httpError = errorCode ? HttpError.fromCode(errorCode) : undefined;
    const bodyMessage =
      (errorCode && contextMessages?.[errorCode]) ||
      httpError?.message ||
      'Something went wrong';

    return isAlert ? (
      <Alert variant="danger" isInline title={`Unable to load ${resourceName}`} />
    ) : (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load ${resourceName}`}
        body={bodyMessage}
      />
    );
  }

  return null;
};
