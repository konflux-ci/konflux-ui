import React, { lazy, Suspense } from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { ErrorBoundary } from '@sentry/react';
import { Loading, StatusBox } from '../status-box/StatusBox';

export type LazyLoadArguments = {
  fallback?: React.ReactElement;
  errorFallback?: React.ReactElement;
};

export const AsyncBoundary = ({ children, loadingFallback, errorFallback }) => {
  return (
    <ErrorBoundary fallback={errorFallback} data-test="lazy-error-boundary">
      <Suspense fallback={loadingFallback ?? <Loading />}>{children}</Suspense>
    </ErrorBoundary>
  );
};

export const lazyLoad = <T extends LazyLoadArguments>(
  importFn,
): ((args: T) => React.ReactElement) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument to address React's implementation of lazyComp
  const LazyComp = lazy(importFn);
  return function LazyWrapper({ fallback, errorFallback, ...props }: T) {
    return (
      <AsyncBoundary
        loadingFallback={
          fallback ?? (
            <Bullseye>
              <Spinner size="xl" />
            </Bullseye>
          )
        }
        errorFallback={errorFallback ?? <StatusBox loadError="Some error occured" />}
        data-test="lazy-async-boundary"
      >
        <LazyComp {...props} />
      </AsyncBoundary>
    );
  };
};
