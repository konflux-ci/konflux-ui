import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MockIntegrationTestsWithBundles,
  MockIntegrationTestsWithGit,
  MockIntegrationTestsWithParams,
} from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useIntegrationTestScenarioForContext } from '~/hooks/useIntegrationTestScenarios';
import { createUseParamsMock, mockUseNamespaceHook, routerRenderer } from '~/unit-test-utils';
import IntegrationTestOverviewTab from '../IntegrationTestOverviewTab';

jest.mock('~/hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenarioForContext: jest.fn(),
}));

jest.mock('~/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

const useIntegrationTestScenarioForContextMock = useIntegrationTestScenarioForContext as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');

const renderTab = () => routerRenderer(<IntegrationTestOverviewTab />);

describe('IntegrationTestOverviewTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useModalLauncherMock.mockReturnValue(jest.fn());
    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      integrationTestName: 'test-app-test-1',
    });
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithGit[0],
      true,
      undefined,
    ]);
  });

  it('should fetch the integration test for the application from the route', () => {
    renderTab();
    expect(useIntegrationTestScenarioForContextMock).toHaveBeenCalledWith(
      'test-ns',
      'test-app-test-1',
      { applicationName: 'test-app', groupName: undefined },
    );
  });

  it('should fetch the integration test for the group from the route', () => {
    useParamsMock.mockReturnValue({
      groupName: 'test-group',
      integrationTestName: 'group-test-1',
    });
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithGit[0],
      true,
      undefined,
    ]);

    renderTab();
    expect(useIntegrationTestScenarioForContextMock).toHaveBeenCalledWith(
      'test-ns',
      'group-test-1',
      {
        applicationName: undefined,
        groupName: 'test-group',
      },
    );
  });

  it('should show error state when integration test fails to load', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([undefined, true, { code: 404 }]);
    renderTab();
    screen.getByText('404: Page not found');
  });

  it('should render correct details', () => {
    renderTab();
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('main'); // revision
    screen.getByText('Optional'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url'); // git url
  });

  it('should render correct param fields', () => {
    renderTab();
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('Git Repository URL'); // url
    screen.getByText('Path in the repository'); // Path in Repo
    screen.getByText('Revision'); // revision
    screen.getByText('Optional'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url'); // git url
  });

  it('should render correct param values', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithGit[1],
      true,
      undefined,
    ]);
    renderTab();
    screen.getByText('test-app-test-2'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('test-url2'); // url
    screen.getByText('main2'); // revision
    screen.getByText('test-path2'); // path
    screen.getByText('Mandatory'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url2'); // git url
    expect(screen.getAllByRole('link')[1].getAttribute('href')).toBe(
      'https://test-url2/tree/main2',
    ); // revision
    expect(screen.getAllByRole('link')[2].getAttribute('href')).toBe(
      'https://test-url2/tree/main2/test-path2',
    ); // path link
  });

  it('should not render param if value is not given', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithGit[3],
      true,
      undefined,
    ]);
    renderTab();
    // revision param has an empty value so its row is skipped
    expect(screen.queryByText('test-path2')).not.toBeInTheDocument();
    screen.getByText('test-app-test-4');
  });

  it('should use the git url from the spec param', () => {
    renderTab();
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url');
  });

  it('should append https to the git url if it is not present in the spec', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithGit[1],
      true,
      undefined,
    ]);
    renderTab();
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url2');
  });

  it('should render correct param values for bundle resolvers', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithBundles[0],
      true,
      undefined,
    ]);
    renderTab();
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('Optional'); // optional for release
    screen.getByText('Bundle');
  });

  it('should display multiple parameters', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithParams[0],
      true,
      undefined,
    ]);
    renderTab();
    screen.getByText('example-git'); // name
    screen.getByText('3 parameters'); // Params
  });

  it('should not pluralize when only one param', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithParams[2],
      true,
      undefined,
    ]);
    renderTab();
    screen.getByText('test-app-test-3'); // name
    screen.getByText('1 parameter'); // Params
  });

  it('should show Modal when edit param is clicked', () => {
    const showModal = jest.fn();
    useModalLauncherMock.mockReturnValue(showModal);
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithParams[0],
      true,
      undefined,
    ]);
    renderTab();
    const editParambtn = screen.getByTestId('edit-param-button'); // Params
    fireEvent.click(editParambtn);
    expect(showModal).toHaveBeenCalled();
  });

  it('should render the application context link', () => {
    renderTab();
    screen.getByText('test-app-test-1');
    screen.getByText('Application');
    expect(screen.getByRole('link', { name: 'test-app' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/test-app',
    );
  });

  it('should render the component group context link', () => {
    useParamsMock.mockReturnValue({
      groupName: 'test-group',
      integrationTestName: 'group-test-1',
    });
    useIntegrationTestScenarioForContextMock.mockReturnValue([
      MockIntegrationTestsWithGit[0],
      true,
      undefined,
    ]);

    renderTab();
    screen.getByText('Component Group');
    expect(screen.getByRole('link', { name: 'test-group' })).toHaveAttribute(
      'href',
      '/ns/test-ns/groups/test-group',
    );
  });
});
