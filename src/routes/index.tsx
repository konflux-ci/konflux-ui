import { createBrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppRoot } from '../AppRoot/AppRoot';
import { AuthProvider } from '../auth/AuthContext';
import { applicationPageLoader } from '../components/Applications';
import ApplicationListView from '../components/Applications/ApplicationListView';
import { Overview } from '../components/Overview/Overview';
import { setupQueryClient } from '../k8s/query/core';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <QueryClientProvider client={setupQueryClient()}>
          <AuthProvider>
            <AppRoot />
          </AuthProvider>
        </QueryClientProvider>
      ),
      children: [
        {
          index: true,
          element: <Overview />,
        },
        {
          path: '/ws/:workspace/applications',
          loader: applicationPageLoader,
          element: <ApplicationListView />,
        },
      ],
    },
  ],
  { basename: '/' },
);
