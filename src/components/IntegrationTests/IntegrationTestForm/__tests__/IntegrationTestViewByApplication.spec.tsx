import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { TrackEvents } from '~/utils/analytics';
import IntegrationTestViewByApplication from '../IntegrationTestViewByApplication';

const mockTrack = jest.fn();
jest.mock('~/utils/analytics', () => ({
  ...jest.requireActual('~/utils/analytics'),
  useTrackEvent: () => mockTrack,
}));

jest.mock('~/components/Applications/breadcrumbs/breadcrumb-utils', () => ({
  useApplicationBreadcrumbs: jest.fn(() => [{ name: 'Applications', path: '/apps' }]),
}));

const mockCreateIntegrationTest = jest.fn();
jest.mock('../utils/create-utils', () => ({
  ...jest.requireActual('../utils/create-utils'),
  createIntegrationTest: (...args: unknown[]) => mockCreateIntegrationTest(...args),
}));

const mockIntegrationTestView = jest.fn(() => (
  <div data-test="integration-test-view">IntegrationTestView</div>
)) as jest.Mock;
jest.mock('../IntegrationTestView', () => ({
  __esModule: true,
  default: (props: unknown) => mockIntegrationTestView(props),
}));

type ViewProps = {
  breadcrumbs: { name: string; path: string }[];
  listPath: string;
  detailsPath: string;
  defaultSelectedContextOption: { name: string; selected?: boolean };
  createIntegrationTest: (values: unknown) => Promise<unknown>;
  trackEvents: Record<string, (...args: never[]) => void>;
  integrationTest?: unknown;
};

const getViewProps = (): ViewProps => mockIntegrationTestView.mock.calls[0][0] as ViewProps;

describe('IntegrationTestViewByApplication', () => {
  const mockNamespace = 'test-ns';
  const mockApplicationName = 'test-app';

  mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({ applicationName: mockApplicationName });
  });

  it('should render IntegrationTestView with application breadcrumbs', () => {
    routerRenderer(<IntegrationTestViewByApplication />);

    expect(screen.getByTestId('integration-test-view')).toBeInTheDocument();
    const props = getViewProps();
    expect(props.breadcrumbs).toEqual([
      { name: 'Applications', path: '/apps' },
      expect.objectContaining({ name: 'Integration tests' }),
    ]);
    expect(props.breadcrumbs[1].path).toContain(mockApplicationName);
  });

  it('should pass listPath and detailsPath for the application', () => {
    const integrationTest: IntegrationTestScenarioKind = MockIntegrationTestsWithGit[0];
    routerRenderer(<IntegrationTestViewByApplication integrationTest={integrationTest} />);

    const props = getViewProps();
    expect(props.listPath).toContain(mockApplicationName);
    expect(props.detailsPath).toContain(integrationTest.metadata.name);
  });

  it('should use the application context as default selected option', () => {
    routerRenderer(<IntegrationTestViewByApplication />);

    const props = getViewProps();
    expect(props.defaultSelectedContextOption).toEqual(
      expect.objectContaining({ name: 'application', selected: true }),
    );
  });

  it('should delegate createIntegrationTest with applicationName and namespace', async () => {
    routerRenderer(<IntegrationTestViewByApplication />);

    const props = getViewProps();
    const formValues = { name: 'new-test' };
    mockCreateIntegrationTest.mockResolvedValue({ metadata: {}, spec: {} });

    await props.createIntegrationTest(formValues);

    expect(mockCreateIntegrationTest).toHaveBeenCalledWith(
      formValues,
      mockApplicationName,
      mockNamespace,
    );
  });

  it('should wire track events for add and edit flows', () => {
    const integrationTest: IntegrationTestScenarioKind = MockIntegrationTestsWithGit[0];
    routerRenderer(<IntegrationTestViewByApplication integrationTest={integrationTest} />);

    const props = getViewProps();

    props.trackEvents.addIntegrationTestSubmit();
    expect(mockTrack).toHaveBeenCalledWith(
      TrackEvents.ButtonClicked,
      expect.objectContaining({ link_name: 'add-integration-test-submit' }),
    );

    props.trackEvents.editIntegrationTestSubmit();
    expect(mockTrack).toHaveBeenCalledWith(
      TrackEvents.ButtonClicked,
      expect.objectContaining({ link_name: 'edit-integration-test-submit' }),
    );

    props.trackEvents.addIntegrationTestLeave();
    expect(mockTrack).toHaveBeenCalledWith(
      TrackEvents.ButtonClicked,
      expect.objectContaining({ link_name: 'add-integration-test-leave' }),
    );

    props.trackEvents.editIntegrationTestLeave();
    expect(mockTrack).toHaveBeenCalledWith(
      TrackEvents.ButtonClicked,
      expect.objectContaining({ link_name: 'edit-integration-test-leave' }),
    );
  });
});
