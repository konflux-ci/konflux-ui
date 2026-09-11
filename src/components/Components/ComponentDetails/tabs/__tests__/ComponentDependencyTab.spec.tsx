import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFeatureFlags, useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ComponentDependencyTab } from '../ComponentDependencyTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useFeatureFlags: jest.fn(),
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/components/MintMaker/DependencyRuns/DependencyRunsListView', () => ({
  DependencyRunsListView: (props: {
    applicationName?: string;
    componentNames: string[];
    filterByCreationTimestampAfter?: string;
    isSingleComponent: boolean;
  }) => <div data-test="dependency-runs-props">{JSON.stringify(props)}</div>,
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const useFeatureFlagsMock = useFeatureFlags as jest.Mock;
const useIsOnFeatureFlagMock = useIsOnFeatureFlag as jest.Mock;
const setFlagMock = jest.fn();

const component = {
  metadata: {
    name: 'test-component',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  spec: {
    componentName: 'test-component',
    application: 'test-application',
  },
};

describe('ComponentDependencyTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({
      applicationName: 'test-application',
      componentName: 'test-component',
    });
    useComponentMock.mockReturnValue([component, true, undefined]);
    useFeatureFlagsMock.mockReturnValue([{ mintmaker: true }, setFlagMock]);
    useIsOnFeatureFlagMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows an alert when PipelineRuns are not fetched from KubeArchive', async () => {
    const user = userEvent.setup();
    useIsOnFeatureFlagMock.mockReturnValue(false);

    renderWithQueryClientAndRouter(<ComponentDependencyTab />);

    expect(screen.getByTestId('mintmaker-plr-alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use KubeArchive for pipeline runs' }));

    expect(setFlagMock).toHaveBeenCalledWith('pipelineruns-kubearchive', true);
  });

  it('shows a spinner while the component is loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);

    renderWithQueryClientAndRouter(<ComponentDependencyTab />);

    expect(screen.getByTestId('dependency-runs-spinner')).toBeInTheDocument();
  });

  it('shows an error when the component cannot be loaded', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('component unavailable')]);

    renderWithQueryClientAndRouter(<ComponentDependencyTab />);

    expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
  });

  it('passes the loaded component and application to the run list', () => {
    renderWithQueryClientAndRouter(<ComponentDependencyTab />);

    expect(useComponentMock).toHaveBeenCalledWith('test-ns', 'test-component', true);
    expect(screen.getByTestId('dependency-runs-props')).toHaveTextContent(
      JSON.stringify({
        applicationName: 'test-application',
        componentNames: ['test-component'],
        filterByCreationTimestampAfter: '2023-01-01T00:00:00Z',
        isSingleComponent: true,
      }),
    );
  });
});
