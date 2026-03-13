import React, { ComponentType, lazy, Suspense } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { Loading } from '../status-box/StatusBox';

export type LazyLoadArguments = {
  fallback: React.ReactElement;
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const LazyComp: React.LazyExoticComponent<ComponentType> = lazy(importFn);
  return function LazyWrapper({ fallback, errorFallback, ...props }: T) {
    return (
      <AsyncBoundary loadingFallback={fallback} errorFallback={errorFallback} data-test="lazy-async-boundary">
        <LazyComp {...props} />
      </AsyncBoundary>
    );
  };
};
