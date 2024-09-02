import * as React from 'react';
import { useRouteError } from 'react-router-dom';
import NoAccessState from '../components/PageAccess/NoAccessState';

export const RouteErrorBoundry: React.FC<React.PropsWithChildren> = ({ children }) => {
  const error = useRouteError() as Response;
  if (error.status === 403) {
    return <NoAccessState />;
  }
  return children;
};
