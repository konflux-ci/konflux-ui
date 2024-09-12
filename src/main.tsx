import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import { ModalProvider } from './components/modal/ModalProvider';
import { queryClient } from './k8s/query/core';
import { router } from './routes';

import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';
import './main.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </ModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
