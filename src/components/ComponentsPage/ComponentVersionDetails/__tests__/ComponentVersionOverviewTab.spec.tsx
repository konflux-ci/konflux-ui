import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useComponent } from '../../../../hooks/useComponents';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import ComponentVersionOverviewTab from '../tabs/ComponentVersionOverviewTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('../tabs/ComponentVersionLatestBuild', () => {
  const MockLatestBuild = () => <div data-test="mock-latest-build">Latest build</div>;
  return { __esModule: true, default: MockLatestBuild };
});

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;

const mockComponent = {
  metadata: { name: 'my-component', namespace: 'test-ns' },
  spec: { componentName: 'my-component', source: { url: 'https://example.com/repo' } },
};

describe('ComponentVersionOverviewTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component', verName: 'main' });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
  });

  it('should not render overview when componentName is missing', () => {
    useParamsMock.mockReturnValue({ verName: 'main' });
    renderWithQueryClientAndRouter(<ComponentVersionOverviewTab />);
    expect(screen.queryByText('Git branch and pipeline')).not.toBeInTheDocument();
  });

  it('should not render overview when verName is missing', () => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
    renderWithQueryClientAndRouter(<ComponentVersionOverviewTab />);
    expect(screen.queryByText('Git branch and pipeline')).not.toBeInTheDocument();
  });

  it('should show spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionOverviewTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('Failed')]);
    renderWithQueryClientAndRouter(<ComponentVersionOverviewTab />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should return null when loaded but component is null', () => {
    useComponentMock.mockReturnValue([null, true, undefined]);
    const { container } = renderWithQueryClientAndRouter(<ComponentVersionOverviewTab />);
    expect(container.firstChild).toBeNull();
  });

  it('should render overview with branch, repository and latest build when loaded', () => {
    renderWithQueryClientAndRouter(<ComponentVersionOverviewTab />);
    expect(screen.getByText('Git branch and pipeline')).toBeInTheDocument();
    expect(screen.getByText('Branch')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('Repository')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Latest build' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'All information is based on the latest successful build of this component for this branch.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-latest-build')).toBeInTheDocument();
  });
});
