import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Button, Spinner } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { APPLICATION_LIST_PATH } from '@routes/paths';
import { RouterParams } from '../../../routes/utils';
import { NamespaceKind } from '../../../types';
import ErrorEmptyState from '../../components/empty-state/ErrorEmptyState';
import { createNamespaceQueryOptions, getLastUsedNamespace, setLastUsedNamespace } from './utils';

export type NamespaceContextData = {
  namespace: string;
  namespaceResource: NamespaceKind | undefined;
  namespacesLoaded: boolean;
  lastUsedNamespace: string;
  namespaces: NamespaceKind[];
};

export const NamespaceContext = React.createContext<NamespaceContextData>({
  namespace: '',
  namespaceResource: undefined,
  namespacesLoaded: false,
  namespaces: [],
  lastUsedNamespace: getLastUsedNamespace(),
});

export const NamespaceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    data: namespaces,
    isLoading: namespaceLoading,
    error: namespacesError,
  } = useQuery(createNamespaceQueryOptions());
  const params = useParams<RouterParams>();
  const navigate = useNavigate();

  const activeNamespaceName: string = params.workspaceName ?? getLastUsedNamespace();

  const homeNamespace = React.useMemo(
    () =>
      !namespaceLoading ? namespaces.find((n) => n.metadata.name === activeNamespaceName) : null,
    [namespaces, namespaceLoading, activeNamespaceName],
  );

  const {
    data: namespaceResource,
    isLoading: activeNamespaceLoading,
    error,
  } = useQuery({
    ...createNamespaceQueryOptions(activeNamespaceName),
    retry: false,
    enabled: !activeNamespaceName,
  });

  React.useEffect(() => {
    if (!error && getLastUsedNamespace() !== activeNamespaceName) {
      setLastUsedNamespace(activeNamespaceName);
    }
  }, [activeNamespaceName, error]);

  if (error) {
    return (
      <ErrorEmptyState
        title={`Unable to access namespace ${activeNamespaceName ?? ''}`}
        body={error.message}
      >
        {homeNamespace ? (
          <Button
            variant="primary"
            onClick={() => {
              setLastUsedNamespace(homeNamespace.metadata.name);
              navigate(
                APPLICATION_LIST_PATH.createPath({ workspaceName: homeNamespace.metadata.name }),
              );
            }}
          >
            Go to {homeNamespace.metadata.name} namespace
          </Button>
        ) : null}
      </ErrorEmptyState>
    );
  }

  // If namespaces failed to load but we have an active namespace, use fallback with empty list
  const namespacesData = namespacesError ? [] : namespaces || [];

  return (
    <NamespaceContext.Provider
      value={{
        namespace: activeNamespaceName,
        namespaceResource,
        namespaces: namespacesData,
        namespacesLoaded: !(namespaceLoading && activeNamespaceLoading),
        lastUsedNamespace: getLastUsedNamespace(),
      }}
    >
      {!(namespaceLoading || activeNamespaceLoading) ? (
        children
      ) : (
        <Bullseye>
          <Spinner />
        </Bullseye>
      )}
    </NamespaceContext.Provider>
  );
};
