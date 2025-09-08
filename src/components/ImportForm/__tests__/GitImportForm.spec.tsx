import { useQuery } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
import { useBuildPipelineConfig } from '../../../hooks/useBuildPipelineConfig';
import { useKonfluxPublicInfo } from '../../../hooks/useKonfluxPublicInfo';
import { useSecrets } from '../../../hooks/useSecrets';
import { routerRenderer } from '../../../utils/test-utils';
import { GitImportForm } from '../GitImportForm';
import { createResourcesWithLinkingComponents } from '../submit-utils';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../../hooks/useSecrets', () => ({
  useSecrets: jest.fn(),
}));

jest.mock('../submit-utils', () => ({
  createResourcesWithLinkingComponents: jest.fn(),
}));

jest.mock('../../../hooks/useUIInstance', () => {
  return {
    useBombinoUrl: jest.fn(() => 'https://mock.bombino.url'),
    useNotifications: jest.fn(() => ({
      notify: jest.fn(),
    })),
  };
});

jest.mock('../../../hooks/useBuildPipelineConfig', () => ({
  useBuildPipelineConfig: jest.fn(),
}));

jest.mock('../../../hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => []),
}));

const mockUseBuildPipelineConfig = useBuildPipelineConfig as jest.Mock;
const mockUseSecrets = useSecrets as jest.Mock;
const mockCreateResources = createResourcesWithLinkingComponents as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;
const mockUseKonfluxPublicInfo = useKonfluxPublicInfo as jest.Mock;

describe('GitImportForm', () => {
  beforeEach(() => {
    mockUseQuery
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      });
    mockUseBuildPipelineConfig.mockReturnValue([
      {
        defaultPipelineName: 'mock-pipeline',
        pipelines: [{ name: 'mock-pipeline', bundle: 'latest' }],
      },
      true,
    ]);
    mockUseSecrets.mockReturnValue([[], true]);
    mockCreateResources.mockImplementation(jest.fn());
    mockUseKonfluxPublicInfo.mockReturnValue([
      { integrations: { github: { application_url: 'https://github.com/apps/konflux-staging' } } },
    ]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the git import form', () => {
    routerRenderer(<GitImportForm applicationName={undefined} />);
    screen.getByText('Add a component');
    screen.getByText('Create application');
  });

  it('should show component form when clicked on Add component', () => {
    routerRenderer(<GitImportForm applicationName={undefined} />);
    const componentButton = screen.getByText('Add a component');
    screen.getByText('Create application');
    fireEvent.click(componentButton);
    expect(screen.queryByText('Add a component')).not.toBeInTheDocument();
    screen.getByPlaceholderText('Enter a GitHub or GitLab repository URL');
    screen.getByTestId('component-name');
  });

  it('should render the component section if application is provided', () => {
    routerRenderer(<GitImportForm applicationName="test-app" />);
    expect(screen.queryByText('Add a component')).not.toBeInTheDocument();
    screen.getByText('Add component');
    screen.getByPlaceholderText('Enter name');
  });

  it('should call createResource on application submit', () => {
    routerRenderer(<GitImportForm applicationName={undefined} />);
    expect(screen.getByText('Create application')).toBeDisabled();
    const componentButton = screen.getByText('Add a component');
    fireEvent.click(componentButton);
    fireEvent.input(screen.getByPlaceholderText('Enter name'), { target: { value: 'test-app' } });
    expect(screen.getByText('Create application')).not.toBeDisabled();
    fireEvent.click(screen.getByText('Create application'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  describe('"Onboarding components to Konflux" alert info', () => {
    it('should render the alert info', () => {
      routerRenderer(<GitImportForm applicationName="test-app" />);
      expect(screen.queryByText('Onboarding components to Konflux')).toBeInTheDocument();
    });

    it('should render ExternalLink to GitHub App if application_url is defined (non-empty string)', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([
        {
          integrations: { github: { application_url: 'https://github.com/apps/konflux-staging' } },
        },
      ]);
      routerRenderer(<GitImportForm applicationName="test-app" />);
      expect(
        screen.getByTestId('git-import-form-konflux-gh-app-external-link'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Konflux GitHub App/)).toBeInTheDocument();
    });

    it('should render plain text if application_url is undefined', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{ integrations: { github: {} } }]);
      routerRenderer(<GitImportForm applicationName="test-app" />);
      expect(
        screen.queryByTestId('git-import-form-konflux-gh-app-external-link'),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Konflux GitHub App/)).toBeInTheDocument();
    });

    it('should render plain text if application_url is null', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([
        { integrations: { github: { application_url: null } } },
      ]);
      routerRenderer(<GitImportForm applicationName="test-app" />);
      expect(
        screen.queryByTestId('git-import-form-konflux-gh-app-external-link'),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Konflux GitHub App/)).toBeInTheDocument();
    });

    it('should render plain text if application_url is an empty string', () => {
      mockUseKonfluxPublicInfo.mockReturnValue([
        { integrations: { github: { application_url: '' } } },
      ]);
      routerRenderer(<GitImportForm applicationName="test-app" />);
      expect(
        screen.queryByTestId('git-import-form-konflux-gh-app-external-link'),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Konflux GitHub App/)).toBeInTheDocument();
    });

    it('should render ExternalLink to #creating-source-control-secrets doc', () => {
      routerRenderer(<GitImportForm applicationName="test-app" />);
      expect(
        screen.getByTestId('git-import-form-konflux-create-secret-external-link'),
      ).toBeInTheDocument();
    });
  });
});
