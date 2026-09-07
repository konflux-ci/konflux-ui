import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useApplication } from '~/hooks/useApplications';
import { useComponents } from '~/hooks/useComponents';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ApplicationDependencyTab } from '../ApplicationDependencyTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('~/hooks/useApplications', () => ({
  useApplication: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

jest.mock('~/components/MintMaker/DependencyRuns/DependencyRunsListView', () => ({
  DependencyRunsListView: (props: {
    applicationName?: string;
    components: string[];
    filterByCreationTimestampAfter?: string;
    isSingleComponent: boolean;
  }) => <div data-test="dependency-runs-props">{JSON.stringify(props)}</div>,
}));

const useParamsMock = useParams as jest.Mock;
const useApplicationMock = useApplication as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;

const application = {
  metadata: {
    name: 'test-application',
    creationTimestamp: '2022-01-01T00:00:00Z',
  },
  spec: {
    displayName: 'Test application',
  },
};
const components = [
  {
    metadata: { name: 'component-alpha' },
    spec: { application: 'test-application' },
  },
];

describe('ApplicationDependencyTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ applicationName: 'test-application' });
    useApplicationMock.mockReturnValue([application, true, undefined]);
    useComponentsMock.mockReturnValue([components, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a spinner while either application resource is loading', () => {
    useComponentsMock.mockReturnValue([[], false, undefined]);

    renderWithQueryClientAndRouter(<ApplicationDependencyTab />);

    expect(screen.getByTestId('dependency-runs-spinner')).toBeInTheDocument();
  });

  it('shows an error when the application resource cannot be loaded', () => {
    useApplicationMock.mockReturnValue([undefined, true, new Error('application unavailable')]);

    renderWithQueryClientAndRouter(<ApplicationDependencyTab />);

    expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
  });

  it('fetches the application and its components before rendering the run list', () => {
    renderWithQueryClientAndRouter(<ApplicationDependencyTab />);

    expect(useApplicationMock).toHaveBeenCalledWith('test-ns', 'test-application');
    expect(useComponentsMock).toHaveBeenCalledWith('test-ns', 'test-application', true);
    expect(screen.getByTestId('dependency-runs-props')).toHaveTextContent(
      JSON.stringify({
        applicationName: 'test-application',
        componentNames: ['component-alpha'],
        filterByCreationTimestampAfter: '2022-01-01T00:00:00Z',
        isSingleComponent: false,
      }),
    );
  });
});
