import * as React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { Form } from '@patternfly/react-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RenderOptions,
  render,
  screen,
  waitForElementToBeRemoved,
  fireEvent,
  act,
} from '@testing-library/react';
import { FormikValues, Formik } from 'formik';
import * as WorkspaceHook from '../components/Workspace/useWorkspaceInfo';
import * as WorkspaceUtils from '../components/Workspace/workspace-context';
import * as ApplicationHook from '../hooks/useApplications';
import * as k8s from '../k8s';
import * as NamespaceUtils from '../shared/providers/Namespace/namespace-context';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}
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
  contextValues?: Partial<WorkspaceUtils.WorkspaceContextData>,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(element, {
    wrapper: ({ children }) => (
      <WorkspaceUtils.WorkspaceContext.Provider
        value={{
          namespace,
          lastUsedWorkspace: 'test-ws',
          workspace: 'test-ws',
          workspaceResource: undefined,
          workspaces: [],
          workspacesLoaded: false,
          ...contextValues,
        }}
      >
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
      </WorkspaceUtils.WorkspaceContext.Provider>
    ),
    ...options,
  });

export const routerRenderer = (
  element: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(element, {
    wrapper: ({ children }) => (
      <ReactRouterDom.BrowserRouter>{children}</ReactRouterDom.BrowserRouter>
    ),
    ...options,
  });

export const mockLocation = (location?: {
  hash?: string;
  port?: number;
  pathname?: string;
  search?: string;
  origin?: string;
  hostname?: string;
}) => {
  const windowLocation = JSON.stringify(window.location);
  delete window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: JSON.parse(windowLocation),
  });
  if (location) {
    Object.assign(window.location, location);
  }
};

export const mockWindowFetch = () => {
  const originalFetch = window.fetch;

  // Ensure window.fetch exists before mocking
  if (typeof window.fetch !== 'function') {
    window.fetch = jest.fn();
  }

  // Use jest.spyOn to mock fetch
  jest.spyOn(window, 'fetch').mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve({ data: 'mocked data' }),
      // Add other methods as needed, e.g.:
      // text: () => Promise.resolve('mocked text'),
      // blob: () => Promise.resolve(new Blob(['mocked blob'])),
    } as Response),
  );

  // Return a cleanup function
  return () => {
    window.fetch = originalFetch;
    jest.restoreAllMocks();
  };
};

export const transformReturnDataForUseK8sWatchResource = (args) => {
  const [data, loaded, error] = args;
  return {
    data,
    isLoading: typeof loaded === 'boolean' ? !loaded : undefined,
    error,
  };
};

export const createK8sWatchResourceMock = () => {
  const mockFn = jest.fn();

  const mockImplementation = (returnValue) => {
    if (Array.isArray(returnValue)) {
      const [data, loaded, error] = returnValue;
      return {
        data: data ?? [],
        isLoading: typeof loaded === 'boolean' ? !loaded : undefined,
        error,
      };
    }
    return returnValue;
  };

  jest
    .spyOn(k8s, 'useK8sWatchResource')
    .mockImplementation((...args) => mockImplementation(mockFn(...args)));

  return mockFn;
};

export const createK8sUtilMock = (name) => {
  const mockFn = jest.fn();

  jest.spyOn(k8s, name).mockImplementation((...args) => mockFn(...args));

  return mockFn;
};

export function renderWithQueryClient(
  ui: React.ReactElement,
  client?: QueryClient,
  renderOptions?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = client ?? createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

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

export const createUseParamsMock = (initialValue: Record<string, string> = {}): jest.Mock => {
  const mockFn = jest.fn().mockReturnValue(initialValue);

  jest.spyOn(ReactRouterDom, 'useParams').mockImplementation(mockFn);

  return mockFn;
};

export const createReactRouterMock = (name): jest.Mock => {
  const mockFn = jest.fn();

  jest.spyOn(ReactRouterDom, name).mockImplementation(mockFn);

  return mockFn;
};

/**
 * @deprecated use [namespace-mock](../unit-test-utils/mock-namespace.ts)
 */
export const createUseWorkspaceInfoMock = (
  initialValue: Record<string, string> = {},
): jest.Mock => {
  const mockFn = jest.fn().mockReturnValue(initialValue);

  jest.spyOn(WorkspaceHook, 'useWorkspaceInfo').mockImplementation(mockFn);

  beforeEach(() => {
    mockFn.mockReturnValue(initialValue);
  });

  return mockFn;
};

export const createUseApplicationMock = (
  initialValue: [{ metadata: { name: string } }, boolean] = [{ metadata: { name: '' } }, false],
): jest.Mock => {
  const mockFn = jest.fn().mockReturnValue(initialValue);

  jest.spyOn(ApplicationHook, 'useApplication').mockImplementation(mockFn);

  beforeEach(() => {
    mockFn.mockReturnValue(initialValue);
  });

  return mockFn;
};

/**
 * @deprecated use {@link WithTestNamespaceContext}
 */
export const WithTestWorkspaceContext =
  (children, data?: WorkspaceUtils.WorkspaceContextData) => () => (
    <WorkspaceUtils.WorkspaceContext.Provider
      value={{
        namespace: 'test-ns',
        lastUsedWorkspace: 'test-ws',
        workspace: 'test-ws',
        workspaceResource: undefined,
        workspacesLoaded: true,
        workspaces: [],
        ...data,
      }}
    >
      {children}
    </WorkspaceUtils.WorkspaceContext.Provider>
  );

export const WithTestNamespaceContext =
  (children, data?: NamespaceUtils.NamespaceContextData) => () => (
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

export const waitForLoadingToFinish = async () =>
  await waitForElementToBeRemoved(() => screen.getByRole('progressbar'));

// Ignore this check for the tests.
// If not, the test will throw an error.
/* eslint-disable @typescript-eslint/require-await */
export const openIntegrationTestContextDropdown = async () => {
  const toggleButton = screen.getByTestId('context-dropdown-toggle').childNodes[1];
  expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  await act(async () => {
    fireEvent.click(toggleButton);
  });
  expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
};

export const getIntegrationTestContextOptionButton = (name: string) => {
  return screen.getByTestId(`context-option-${name}`).childNodes[0];
};
