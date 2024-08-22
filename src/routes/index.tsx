import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { AuthProvider } from '../auth/AuthContext';
import { applicationPageLoader } from '../components/Applications';
import ApplicationListView from '../components/Applications/ApplicationListView';
import { Overview } from '../components/Overview/Overview';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <AuthProvider>
          <AppRoot />
        </AuthProvider>
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
