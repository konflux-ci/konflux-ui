import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../components/AppRoot/AppRoot';
import { Overview } from '../components/Overview/Overview';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    children: [
      {
        index: true,
        element: <Overview />,
      },
    ],
  },
]);
