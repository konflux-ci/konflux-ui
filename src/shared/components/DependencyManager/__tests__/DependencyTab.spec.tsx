import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { DependencyTab } from '~/shared/components/DependencyManager/DependencyTab';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('~/shared/components/DependencyManager/DependencyRunsListView', () => ({
  DependencyRunsListView: ({
    applicationName,
    componentName,
  }: {
    applicationName: string;
    componentName: string;
  }) => (
    <div data-test="mock-dependency-runs-list-view">
      {applicationName} - {componentName}
    </div>
  ),
}));

const useParamsMock = useParams as jest.Mock;

describe('DependencyTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({
      componentName: 'test-component',
      applicationName: 'test-application',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Dependency updates" section heading', () => {
    renderWithQueryClientAndRouter(<DependencyTab />);
    expect(screen.getByRole('heading', { name: /Dependency updates/i })).toBeInTheDocument();
  });

  it('passes the componentName from route params to DependencyRunsListView', () => {
    renderWithQueryClientAndRouter(<DependencyTab />);
    expect(screen.getByTestId('mock-dependency-runs-list-view')).toHaveTextContent(
      'test-component',
    );
  });

  it('passes the applicationName from route params to DependencyRunsListView', () => {
    renderWithQueryClientAndRouter(<DependencyTab />);
    expect(screen.getByTestId('mock-dependency-runs-list-view')).toHaveTextContent(
      'test-application',
    );
  });
});
