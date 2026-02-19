import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useComponent } from '~/hooks/useComponents';
import { useComponentVersions } from '~/hooks/useComponentVersions';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import ComponentVersionsTab from '../ComponentVersionsTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/useComponentVersions', () => ({
  useComponentVersions: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(() => true),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const useComponentVersionsMock = useComponentVersions as jest.Mock;

const mockComponent = {
  metadata: { name: 'my-component', namespace: 'test-ns' },
  spec: {
    componentName: 'my-component',
    application: 'my-app',
    source: { url: 'https://github.com/org/repo' },
  },
};

const mockVersions = [
  { name: 'main', description: '', pipelineName: 'pipeline-a', pipelineRunName: 'plr-1' },
  { name: 'develop', description: '', pipelineName: 'pipeline-b', pipelineRunName: 'plr-2' },
];

describe('ComponentVersionsTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    useComponentVersionsMock.mockReturnValue([mockVersions, true, undefined]);
  });

  it('should return null when componentName is missing', () => {
    useParamsMock.mockReturnValue({});
    const { container } = renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(container.firstChild).toBeNull();
  });

  it('should show spinner when component is loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('Failed')]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should show spinner when versions are loading', () => {
    useComponentVersionsMock.mockReturnValue([[], false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when versions fail to load', () => {
    useComponentVersionsMock.mockReturnValue([[], true, new Error('Failed')]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Unable to load versions')).toBeInTheDocument();
  });

  it('should display Versions section with empty message when no versions', () => {
    useComponentVersionsMock.mockReturnValue([[], true, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(
      screen.getByText('No branches with pipeline runs found for this component.'),
    ).toBeInTheDocument();
  });

  it('should display versions table with columns and Find by name search when versions exist', () => {
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Branches that have pipeline runs for this component. Select a version to view its overview and activity.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find by name')).toBeInTheDocument();
    expect(screen.getByText('Version name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Git branch or tag')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByTestId('version-name-main')).toBeInTheDocument();
    expect(screen.getByTestId('version-name-develop')).toBeInTheDocument();
  });
});
