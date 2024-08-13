import { createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { AppRoot } from '../components/AppRoot/AppRoot';
import { Overview } from '../components/Overview/Overview';

export const router = createBrowserRouter([
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
    ],
  },
]);
