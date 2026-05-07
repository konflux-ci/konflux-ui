import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useComponent } from '~/hooks/useComponents';
import { ComponentKind, ComponentSpecs } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import ComponentVersionDetailsTab from '../ComponentVersionDetailsTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/components/GitLink/GitRepoLink', () => {
  return ({ url, revision }: { url: string; revision?: string }) => (
    <span data-test="git-repo-link">
      {url} ({revision})
    </span>
  );
});

jest.mock('~/components/LatestBuild/LatestBuildSection', () => {
  return ({
    component,
    version,
  }: {
    component: { metadata: { name: string } };
    version?: string;
  }) => (
    <div data-test="latest-build-section">
      LatestBuild: {component.metadata.name} / {version}
    </div>
  );
});

jest.mock('~/components/DetailsPage', () => ({
  DetailsSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-test={`details-section-${title}`}>
      <h4>{title}</h4>
      {children}
    </div>
  ),
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;

const mockComponent: Partial<ComponentKind> = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
    uid: 'uid-1',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    source: {
      url: 'https://github.com/org/repo',
      versions: [
        {
          name: 'Version 1.0',
          revision: 'ver-1.0',
          context: './frontend',
          'build-pipeline': {
            pull: { 'pipelineref-by-name': 'version-pipeline' },
          },
        },
        { name: 'Main', revision: 'main' },
      ],
    },
    'default-build-pipeline': {
      push: { 'pipelineref-by-name': 'default-pipeline' },
    },
    containerImage: 'quay.io/org/repo',
  } as ComponentSpecs,
};

describe('ComponentVersionDetailsTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: 'ver-1.0',
    });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render a spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('Unable to load Component version')).toBeInTheDocument();
  });

  it('should render 404 error when version is not found', () => {
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: 'nonexistent',
    });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('should render version name', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('version-name')).toHaveTextContent('Version 1.0');
  });

  it('should render GitRepoLink when repo URL is available', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('git-repo-link')).toHaveTextContent(
      'https://github.com/org/repo (ver-1.0)',
    );
  });

  it('should render revision as plain text when repo URL is missing', () => {
    const componentNoUrl = {
      ...mockComponent,
      spec: {
        ...mockComponent.spec,
        source: {
          versions: mockComponent.spec.source.versions,
        },
      },
    };
    useComponentMock.mockReturnValue([componentNoUrl, true, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('version-branch')).toHaveTextContent('ver-1.0');
    expect(screen.queryByTestId('git-repo-link')).not.toBeInTheDocument();
  });

  it('should render "-" when revision is empty and no repo URL', () => {
    const componentEmptyRevision = {
      ...mockComponent,
      spec: {
        ...mockComponent.spec,
        source: {
          versions: [{ name: 'Empty', revision: '' }],
        },
      },
    };
    useComponentMock.mockReturnValue([componentEmptyRevision, true, undefined]);
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: '',
    });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('version-branch')).toHaveTextContent('-');
  });

  it('should render pipeline name from version build-pipeline', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('version-pipeline')).toHaveTextContent('version-pipeline');
  });

  it('should fall back to default-build-pipeline when version has none', () => {
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: 'main',
    });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('version-pipeline')).toHaveTextContent('default-pipeline');
  });

  it('should render "-" when no pipeline is configured', () => {
    const componentNoPipeline = {
      ...mockComponent,
      spec: {
        ...mockComponent.spec,
        'default-build-pipeline': undefined,
        source: {
          url: 'https://github.com/org/repo',
          versions: [{ name: 'No Pipeline', revision: 'no-pipeline' }],
        },
      },
    };
    useComponentMock.mockReturnValue([componentNoPipeline, true, undefined]);
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: 'no-pipeline',
    });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByTestId('version-pipeline')).toHaveTextContent('-');
  });

  it('should render the LatestBuildSection with correct props', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    const latestBuild = screen.getByTestId('latest-build-section');
    expect(latestBuild).toHaveTextContent('LatestBuild: my-component / ver-1.0');
  });

  it('should render the Version details section title', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('Version details')).toBeInTheDocument();
  });
});
