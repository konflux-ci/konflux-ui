import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { ComponentDependencyTab } from '../ComponentDependencyTab';

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('~/components/Components/ComponentDependencyManager/DependencyRunsListView', () => ({
  DependencyRunsListView: ({ componentName }: { componentName: string }) => (
    <div data-test="mock-dependency-runs-list-view">{componentName}</div>
  ),
}));

const useParamsMock = useParams as jest.Mock;

describe('ComponentDependencyTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'test-component' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Dependency updates" section heading', () => {
    renderWithQueryClientAndRouter(<ComponentDependencyTab />);
    expect(screen.getByRole('heading', { name: /Dependency updates/i })).toBeInTheDocument();
  });

  it('passes the componentName from route params to DependencyRunsListView', () => {
    renderWithQueryClientAndRouter(<ComponentDependencyTab />);
    expect(screen.getByTestId('mock-dependency-runs-list-view')).toHaveTextContent(
      'test-component',
    );
  });
});
