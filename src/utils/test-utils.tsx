/**
 * MIGRATION NOTE: This file serves as a backward compatibility layer during the transition
 * to the new organized test utilities in ~/unit-test-utils. Once all tests have been migrated
 * to import directly from ~/unit-test-utils, these re-exports should be removed.
 *
 */

import { createUseApplicationMock as _createUseApplicationMock } from '../unit-test-utils/mock-application-hooks';
import {
  mockLocation as _mockLocation,
  mockWindowFetch as _mockWindowFetch,
} from '../unit-test-utils/mock-browser';
import {
  transformReturnDataForUseK8sWatchResource as _transformReturnDataForUseK8sWatchResource,
  createK8sWatchResourceMock as _createK8sWatchResourceMock,
  createK8sUtilMock as _createK8sUtilMock,
  createKubearchiveUtilMock as _createKubearchiveUtilMock,
} from '../unit-test-utils/mock-k8s';
import {
  createTestQueryClient as _createTestQueryClient,
  renderWithQueryClient as _renderWithQueryClient,
} from '../unit-test-utils/mock-react-query';
import {
  createUseParamsMock as _createUseParamsMock,
  createReactRouterMock as _createReactRouterMock,
  routerRenderer as _routerRenderer,
} from '../unit-test-utils/mock-react-router';
import {
  formikRenderer as _formikRenderer,
  namespaceRenderer as _namespaceRenderer,
  renderWithQueryClientAndRouter as _renderWithQueryClientAndRouter,
  WithTestNamespaceContext as _WithTestNamespaceContext,
} from '../unit-test-utils/rendering-utils';
import {
  waitForLoadingToFinish as _waitForLoadingToFinish,
  openIntegrationTestContextDropdown as _openIntegrationTestContextDropdown,
  getIntegrationTestContextOptionButton as _getIntegrationTestContextOptionButton,
} from '../unit-test-utils/test-helpers';

/**
 * @deprecated Use createTestQueryClient from ~/unit-test-utils/mock-react-query instead
 * Creates a test QueryClient with optimized settings for testing
 */
export const createTestQueryClient = _createTestQueryClient;

/**
 * @deprecated Use formikRenderer from ~/unit-test-utils/rendering-utils instead
 * Renders a component with Formik wrapper and QueryClient
 */
export const formikRenderer = _formikRenderer;

/**
 * @deprecated Use namespaceRenderer from ~/unit-test-utils/rendering-utils instead
 * Renders a component with NamespaceContext provider
 */
export const namespaceRenderer = _namespaceRenderer;

/**
 * @deprecated Use renderWithQueryClient from ~/unit-test-utils/mock-react-query instead
 * Renders a component with QueryClient provider
 */
export const renderWithQueryClient = _renderWithQueryClient;

/**
 * @deprecated Use renderWithQueryClientAndRouter from ~/unit-test-utils/rendering-utils instead
 * Renders a component with QueryClient and Router providers
 */
export const renderWithQueryClientAndRouter = _renderWithQueryClientAndRouter;

/**
 * @deprecated Use routerRenderer from ~/unit-test-utils/mock-react-router instead
 * Renders a component with BrowserRouter wrapper
 */
export const routerRenderer = _routerRenderer;

/**
 * @deprecated Use mockLocation from ~/unit-test-utils/mock-browser instead
 * Mock window.location with custom properties
 */
export const mockLocation = _mockLocation;

/**
 * @deprecated Use mockWindowFetch from ~/unit-test-utils/mock-browser instead
 * Mock window.fetch for testing HTTP requests
 */
export const mockWindowFetch = _mockWindowFetch;

/**
 * @deprecated Use transformReturnDataForUseK8sWatchResource from ~/unit-test-utils/mock-k8s instead
 * Transforms return data for useK8sWatchResource hook to new format
 */
export const transformReturnDataForUseK8sWatchResource = _transformReturnDataForUseK8sWatchResource;

/**
 * @deprecated Use createK8sWatchResourceMock from ~/unit-test-utils/mock-k8s instead
 * Creates a mock for useK8sWatchResource hook
 */
export const createK8sWatchResourceMock = _createK8sWatchResourceMock;

/**
 * @deprecated Use createK8sUtilMock from ~/unit-test-utils/mock-k8s instead
 * Creates a type-safe mock for any k8s utility function
 */
export const createK8sUtilMock = _createK8sUtilMock;

/**
 * @deprecated Use createKubearchiveUtilMock from ~/unit-test-utils/mock-k8s instead
 * Creates a type-safe mock for any kubearchive utility function
 */
export const createKubearchiveUtilMock = _createKubearchiveUtilMock;

/**
 * @deprecated Use createUseParamsMock from ~/unit-test-utils/mock-react-router instead
 * Creates a mock for useParams hook with initial values
 */
export const createUseParamsMock = _createUseParamsMock;

/**
 * @deprecated Use createReactRouterMock from ~/unit-test-utils/mock-react-router instead
 * Creates a type-safe mock for any React Router hook
 */
export const createReactRouterMock = _createReactRouterMock;

/**
 * @deprecated Use createUseApplicationMock from ~/unit-test-utils/mock-application-hooks instead
 * Creates a type-safe mock for useApplication hook with initial value
 */
export const createUseApplicationMock = _createUseApplicationMock;

/**
 * @deprecated Use WithTestNamespaceContext from ~/unit-test-utils/rendering-utils instead
 * Higher-order component for providing test namespace context
 */
export const WithTestNamespaceContext = _WithTestNamespaceContext;

/**
 * @deprecated Use waitForLoadingToFinish from ~/unit-test-utils/test-helpers instead
 * Waits for loading spinner to finish
 */
export const waitForLoadingToFinish = _waitForLoadingToFinish;

/**
 * @deprecated Use openIntegrationTestContextDropdown from ~/unit-test-utils/test-helpers instead
 * Opens integration test context dropdown
 */
export const openIntegrationTestContextDropdown = _openIntegrationTestContextDropdown;

/**
 * @deprecated Use getIntegrationTestContextOptionButton from ~/unit-test-utils/test-helpers instead
 * Gets integration test context option button by name
 */
export const getIntegrationTestContextOptionButton = _getIntegrationTestContextOptionButton;
