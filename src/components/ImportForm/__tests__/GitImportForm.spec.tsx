import { useQuery } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
import { useBuildPipelineConfig } from '../../../hooks/useBuildPipelineConfig';
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

const mockUseBuildPipelineConfig = useBuildPipelineConfig as jest.Mock;
const mockUseSecrets = useSecrets as jest.Mock;
const mockCreateResources = createResourcesWithLinkingComponents as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;

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
    screen.getByPlaceholderText('Enter your source');
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
});
