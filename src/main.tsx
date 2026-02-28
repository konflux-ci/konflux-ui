import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ReactDOM from 'react-dom/client';
import { initAnalytics } from '~/analytics';
import { initMonitoring } from '~/monitoring';
import { AuthProvider } from './auth/AuthContext';
import { forceEnableFlagsOnce } from './feature-flags/forceEnableFlagsOnce';
import { FeatureFlagsStore } from './feature-flags/store';
import { getAllConditionsKeysFromFlags } from './feature-flags/utils';
import { queryClient } from './k8s/query/core';
import { REGISTRATIONS_LOADED } from './registers';
import { router } from './routes';
import { ThemeProvider } from './shared/theme/ThemeContext';

import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';
import './main.scss';

// TEMP: Force-enable selected flags once per release/build
forceEnableFlagsOnce(['kubearchive-logs', 'taskruns-kubearchive', 'pipelineruns-kubearchive'], {
  releaseId: '2025-11-17',
});

const App = () => {
  React.useEffect(() => {
    // webpack side effects to prevent tree-shaking
    if (REGISTRATIONS_LOADED) {
      void FeatureFlagsStore.ensureConditions(getAllConditionsKeysFromFlags());
    }
  }, []);

  return (
    <>
      <RouterProvider
        router={router}
        fallbackElement={
          <Bullseye>
            <Spinner />
          </Bullseye>
        }
      />
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </>
  );
};

void (() => {
  const initializers = [
    { name: 'monitoring', context: 'initMonitoring', init: initMonitoring },
    { name: 'analytics', context: 'initAnalytics', init: initAnalytics },
  ] as const;

  void Promise.allSettled(initializers.map(({ init }) => init())).then((results) => {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const { name, context } = initializers[i];
        // eslint-disable-next-line no-console
        console.error(`Failed to initialize ${name} ${context}`, result.reason);
      }
    });
  });

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
})();
