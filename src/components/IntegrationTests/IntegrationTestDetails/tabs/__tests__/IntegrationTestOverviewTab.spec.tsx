import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntegrationTestScenarioModel } from '../../../../../models';
import {
  createK8sWatchResourceMock,
  createUseParamsMock,
  createUseWorkspaceInfoMock,
  routerRenderer,
} from '../../../../../utils/test-utils';
import { useModalLauncher } from '../../../../modal/ModalProvider';
import {
  MockIntegrationTestsWithBundles,
  MockIntegrationTestsWithGit,
  MockIntegrationTestsWithParams,
} from '../../../IntegrationTestsListView/__data__/mock-integration-tests';
import IntegrationTestOverviewTab from '../IntegrationTestOverviewTab';

jest.mock('../../../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

createUseWorkspaceInfoMock({ namespace: 'test-namepsace', workspace: 'test-ws' });

const watchResourceMock = createK8sWatchResourceMock();

const useParamsMock = createUseParamsMock();

const getMockedResources = (mocks) => (params, model) => {
  if (model.kind === IntegrationTestScenarioModel.kind) {
    return {
      data: mocks.find((t) => !params.name || t.metadata.name === params.name),
      isLoading: false,
    };
  }
  return { data: [], isLoading: false };
};

describe('IntegrationTestOverviewTab', () => {
  it('should render correct details', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-1',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithGit));
    routerRenderer(<IntegrationTestOverviewTab />);
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('main'); // revision
    screen.getByText('Optional'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url'); // git url
  });

  it('should render correct param fields', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-1',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithGit));
    routerRenderer(<IntegrationTestOverviewTab />);
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('Git URL'); // url
    screen.getByText('Path in repository'); // Path in Repo
    screen.getByText('Revision'); // revision
    screen.getByText('Optional'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url'); // git url
  });

  it('should render correct param values', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-2',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithGit));
    routerRenderer(<IntegrationTestOverviewTab />);
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
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-4',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithGit));
    expect(screen.queryByText('revision')).not.toBeInTheDocument();
  });

  it('should use the git url from the spec param', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-1',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithGit));
    routerRenderer(<IntegrationTestOverviewTab />);
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url');
  });

  it('should append https to the git url if it is not present in the spec', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-2',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithGit));
    routerRenderer(<IntegrationTestOverviewTab />);
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url2');
  });

  it('should render correct param values for bundle resolvers', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-1',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithBundles));
    routerRenderer(<IntegrationTestOverviewTab />);
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('Optional'); // optional for release
    screen.getByText('Bundle');
  });

  it('should display multiple parameters', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'example-git',
      applicationName: 'example-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithParams));
    routerRenderer(<IntegrationTestOverviewTab />);
    screen.getByText('example-git'); // name
    screen.getByText('3 parameters'); // Params
  });

  it('should not pluralize when only one param', () => {
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-3',
      applicationName: 'test-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithParams));
    routerRenderer(<IntegrationTestOverviewTab />);
    screen.getByText('test-app-test-3'); // name
    screen.getByText('1 parameter'); // Params
  });

  it('should show Modal when edit param is clicked', () => {
    const showModal = jest.fn();
    (useModalLauncher as jest.Mock).mockImplementation(() => {
      return showModal;
    });
    useParamsMock.mockReturnValue({
      integrationTestName: 'example-git',
      applicationName: 'example-app',
    });
    watchResourceMock.mockImplementation(getMockedResources(MockIntegrationTestsWithParams));
    routerRenderer(<IntegrationTestOverviewTab />);
    const editParambtn = screen.getByTestId('edit-param-button'); // Params
    fireEvent.click(editParambtn);
    expect(showModal).toHaveBeenCalled();
  });
});
