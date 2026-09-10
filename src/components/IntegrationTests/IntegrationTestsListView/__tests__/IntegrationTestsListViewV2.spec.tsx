import * as React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useIntegrationTestScenariosV2 } from '~/hooks/useIntegrationTestScenariosV2';
import { IntegrationTestScenarioKind, ResolverType } from '~/types/coreBuildService';
import {
  mockAccessReviewUtil,
  mockUseNamespaceHook,
  renderWithQueryClient,
  setupVirtualizerMock,
} from '~/unit-test-utils';
import IntegrationTestsListViewV2 from '../IntegrationTestsListViewV2';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ groupName: 'test-group' }),
}));

jest.mock('~/hooks/useIntegrationTestScenariosV2', () => ({
  useIntegrationTestScenariosV2: jest.fn(),
}));

const useIntegrationTestScenariosV2Mock = useIntegrationTestScenariosV2 as jest.Mock;
const accessReviewMock = mockAccessReviewUtil('useAccessReviewForModel', [true, true]);
mockUseNamespaceHook('test-ns');

const createMockScenario = (
  name: string,
  uid: string,
  options: { optional?: boolean; url?: string; revision?: string } = {},
): IntegrationTestScenarioKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1beta2',
    kind: 'IntegrationTestScenario',
    metadata: {
      name,
      namespace: 'test-ns',
      uid,
      ...(options.optional !== undefined
        ? { labels: { 'test.appstudio.openshift.io/optional': String(options.optional) } }
        : undefined),
    },
    spec: {
      application: 'test-app',
      componentGroup: 'test-group',
      ...(options.url !== undefined || options.revision !== undefined
        ? {
            resolverRef: {
              resolver: ResolverType.GIT,
              resourceKind: 'pipeline',
              params: [
                { name: 'url', value: options.url ?? '' },
                { name: 'revision', value: options.revision ?? '' },
                { name: 'pathInRepo', value: 'pipelines/test.yaml' },
              ],
            },
          }
        : undefined),
    },
  }) as unknown as IntegrationTestScenarioKind;

const mockTestsV2: IntegrationTestScenarioKind[] = [
  createMockScenario('group-test-1', 'uid-1', {
    optional: true,
    url: 'https://github.com/example/repo-1',
    revision: 'main',
  }),
  createMockScenario('group-test-2', 'uid-2', {
    optional: false,
    url: 'https://github.com/example/repo-2',
    revision: 'develop',
  }),
];

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <IntegrationTestsListViewV2 />
  </NuqsTestingAdapter>
);

describe('IntegrationTestsListViewV2', () => {
  const alertMock = jest.spyOn(window, 'alert').mockImplementation(jest.fn());

  beforeEach(() => {
    jest.useFakeTimers();
    setupVirtualizerMock();
    useIntegrationTestScenariosV2Mock.mockReturnValue([mockTestsV2, true, undefined]);
    accessReviewMock.mockReturnValue([true, true]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    alertMock.mockClear();
  });

  it('should show a loading skeleton while tests are loading', () => {
    useIntegrationTestScenariosV2Mock.mockReturnValue([[], false, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should show an error state when loading tests fails', () => {
    useIntegrationTestScenariosV2Mock.mockReturnValue([[], true, { code: 500 }]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load integration tests')).toBeInTheDocument();
  });

  it('should show the empty state when there are no tests', () => {
    useIntegrationTestScenariosV2Mock.mockReturnValue([[], true, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('integration-tests__empty')).toBeInTheDocument();
    expect(screen.getByText('Test any code changes')).toBeInTheDocument();
    expect(screen.getByTestId('add-integration-test-empty')).toBeInTheDocument();
  });

  it('should call the hook with the current namespace and group', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(useIntegrationTestScenariosV2Mock).toHaveBeenCalledWith('test-ns', 'test-group');
  });

  it('should render test rows with name, git url, release flag, and revision', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('table-v2')).toBeInTheDocument();
    expect(screen.getByText('group-test-1')).toBeInTheDocument();
    expect(screen.getByText('group-test-2')).toBeInTheDocument();

    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.getByText('Mandatory')).toBeInTheDocument();

    expect(screen.getByText('https://github.com/example/repo-1')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/example/repo-2')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('develop')).toBeInTheDocument();
  });

  it('should render a dash when a test has no resolver params', () => {
    useIntegrationTestScenariosV2Mock.mockReturnValue([
      [createMockScenario('no-resolver-test', 'uid-3')],
      true,
      undefined,
    ]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('no-resolver-test')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('should filter tests by name from the URL', () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=group-test-1" />);

    expect(screen.getByText('group-test-1')).toBeInTheDocument();
    expect(screen.queryByText('group-test-2')).not.toBeInTheDocument();
  });

  it('should show the filtered empty state when the name filter matches nothing', () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=does-not-exist" />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should filter the table when a name is entered', () => {
    renderWithQueryClient(<TestedComponent />);

    const filter = screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
    fireEvent.change(filter, { target: { value: 'group-test-1' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByText('group-test-1')).toBeInTheDocument();
    expect(screen.queryByText('group-test-2')).not.toBeInTheDocument();
  });

  it('should trigger the add handler from the toolbar button', () => {
    renderWithQueryClient(<TestedComponent />);

    fireEvent.click(screen.getByTestId('add-integration-test-toolbar'));

    expect(alertMock).toHaveBeenCalledWith('TODO');
  });

  it('should trigger the add handler from the empty state button', () => {
    useIntegrationTestScenariosV2Mock.mockReturnValue([[], true, undefined]);

    renderWithQueryClient(<TestedComponent />);

    fireEvent.click(screen.getByTestId('add-integration-test-empty'));

    expect(alertMock).toHaveBeenCalledWith('TODO');
  });

  it('should disable the add buttons when the user cannot create tests', () => {
    accessReviewMock.mockReturnValue([false, true]);
    useIntegrationTestScenariosV2Mock.mockReturnValue([mockTestsV2, true, undefined]);

    const { rerender } = renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('add-integration-test-toolbar')).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    useIntegrationTestScenariosV2Mock.mockReturnValue([[], true, undefined]);
    rerender(
      <NuqsTestingAdapter>
        <IntegrationTestsListViewV2 />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('add-integration-test-empty')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
