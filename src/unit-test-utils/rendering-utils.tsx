import * as React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { Form } from '@patternfly/react-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderOptions, render } from '@testing-library/react';
import { FormikValues, Formik } from 'formik';
import * as NamespaceUtils from '../shared/providers/Namespace/namespace-context';
import { createTestQueryClient } from './mock-react-query';

export const formikRenderer = (
  element: React.ReactElement,
  initialValues?: FormikValues,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const client = createTestQueryClient();
  return render(element, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <Formik initialValues={initialValues} onSubmit={() => {}}>
          {({ handleSubmit }) => <Form onSubmit={handleSubmit}>{children}</Form>}
        </Formik>
      </QueryClientProvider>
    ),
    ...options,
  });
};

export const namespaceRenderer = (
  element: React.ReactElement,
  namespace: string,
  contextValues?: Partial<NamespaceUtils.NamespaceContextData>,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(element, {
    wrapper: ({ children }) => (
      <NamespaceUtils.NamespaceContext.Provider
        value={{
          namespace,
          lastUsedNamespace: 'test-ws',
          namespaceResource: undefined,
          namespaces: [],
          namespacesLoaded: false,
          ...contextValues,
        }}
      >
        {children}
      </NamespaceUtils.NamespaceContext.Provider>
    ),
    ...options,
  });

export function renderWithQueryClientAndRouter(
  ui: React.ReactElement,
  client?: QueryClient,
  renderOptions?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = client ?? createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ReactRouterDom.BrowserRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ReactRouterDom.BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export const WithTestNamespaceContext =
  (children: React.ReactNode, data?: Partial<NamespaceUtils.NamespaceContextData>) =>
  (): React.ReactElement => (
    <NamespaceUtils.NamespaceContext.Provider
      value={{
        namespace: 'test-ws',
        lastUsedNamespace: 'test-ws',
        namespaceResource: undefined,
        namespaces: [],
        namespacesLoaded: false,
        ...data,
      }}
    >
      {children}
    </NamespaceUtils.NamespaceContext.Provider>
  );
