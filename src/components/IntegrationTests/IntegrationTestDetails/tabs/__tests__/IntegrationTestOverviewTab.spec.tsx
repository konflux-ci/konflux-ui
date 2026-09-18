import type { ComponentProps } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MockIntegrationTestsWithBundles,
  MockIntegrationTestsWithGit,
  MockIntegrationTestsWithParams,
} from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { routerRenderer } from '~/unit-test-utils';
import IntegrationTestOverviewTab from '../IntegrationTestOverviewTab';

jest.mock('~/shared/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

const useModalLauncherMock = useModalLauncher as jest.Mock;

const appContextProps = {
  integrationTest: MockIntegrationTestsWithGit[0],
  loaded: true,
  error: undefined,
  contextTitle: 'Application',
  contextDetailsPath: '/apps/test-app',
  contextName: 'test-app',
} as const;

const renderTab = (props: Partial<ComponentProps<typeof IntegrationTestOverviewTab>> = {}) =>
  routerRenderer(<IntegrationTestOverviewTab {...appContextProps} {...props} />);

describe('IntegrationTestOverviewTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useModalLauncherMock.mockReturnValue(jest.fn());
  });

  it('should show error state when integration test fails to load', () => {
    renderTab({ integrationTest: undefined, error: { code: 404 } });
    screen.getByText('404: Page not found');
  });

  it('should render correct details', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithGit[0] });
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('main'); // revision
    screen.getByText('Optional'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url'); // git url
  });

  it('should render correct param fields', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithGit[0] });
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('Git Repository URL'); // url
    screen.getByText('Path in the repository'); // Path in Repo
    screen.getByText('Revision'); // revision
    screen.getByText('Optional'); // optional for release
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url'); // git url
  });

  it('should render correct param values', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithGit[1] });
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
    renderTab({ integrationTest: MockIntegrationTestsWithGit[3] });
    // revision param has an empty value so its row is skipped
    expect(screen.queryByText('test-path2')).not.toBeInTheDocument();
    screen.getByText('test-app-test-4');
  });

  it('should use the git url from the spec param', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithGit[0] });
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url');
  });

  it('should append https to the git url if it is not present in the spec', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithGit[1] });
    expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('https://test-url2');
  });

  it('should render correct param values for bundle resolvers', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithBundles[0] });
    screen.getByText('test-app-test-1'); // name
    screen.getByText('test-namespace'); // namespace
    screen.getByText('Optional'); // optional for release
    screen.getByText('Bundle');
  });

  it('should display multiple parameters', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithParams[0] });
    screen.getByText('example-git'); // name
    screen.getByText('3 parameters'); // Params
  });

  it('should not pluralize when only one param', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithParams[2] });
    screen.getByText('test-app-test-3'); // name
    screen.getByText('1 parameter'); // Params
  });

  it('should show Modal when edit param is clicked', () => {
    const showModal = jest.fn();
    useModalLauncherMock.mockReturnValue(showModal);
    renderTab({ integrationTest: MockIntegrationTestsWithParams[0] });
    const editParambtn = screen.getByTestId('edit-param-button'); // Params
    fireEvent.click(editParambtn);
    expect(showModal).toHaveBeenCalled();
  });

  it('should render the application context link', () => {
    renderTab({ integrationTest: MockIntegrationTestsWithGit[0] });
    screen.getByText('Application');
    expect(screen.getByRole('link', { name: 'test-app' })).toHaveAttribute(
      'href',
      '/apps/test-app',
    );
  });

  it('should render a custom context title and link for component groups', () => {
    renderTab({
      integrationTest: MockIntegrationTestsWithGit[0],
      contextTitle: 'Component Group',
      contextDetailsPath: '/groups/test-group',
      contextName: 'test-group',
    });
    screen.getByText('Component Group');
    expect(screen.getByRole('link', { name: 'test-group' })).toHaveAttribute(
      'href',
      '/groups/test-group',
    );
  });

  it('should render placeholders when metadata is missing', () => {
    renderTab({ integrationTest: undefined });
    // Name, namespace and created-at fall back to '-'
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
