import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import { queryClient } from './k8s/query/core';
import { router } from './routes';

import '@patternfly/react-core/dist/styles/base.css';
import './main.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
