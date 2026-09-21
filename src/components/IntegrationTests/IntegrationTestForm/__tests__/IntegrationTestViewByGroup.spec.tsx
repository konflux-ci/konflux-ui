import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { TrackEvents } from '~/utils/analytics';
import IntegrationTestViewByGroup from '../IntegrationTestViewByGroup';

const mockTrack = jest.fn();
jest.mock('~/utils/analytics', () => ({
  ...jest.requireActual('~/utils/analytics'),
  useTrackEvent: () => mockTrack,
}));

jest.mock('~/components/ComponentGroups/breadcrumb-utils', () => ({
  useComponentGroupBreadcrumbs: jest.fn(() => [{ name: 'Groups', path: '/groups' }]),
}));

const mockCreateIntegrationTestForComponentGroup = jest.fn();
jest.mock('../utils/create-utils', () => ({
  ...jest.requireActual('../utils/create-utils'),
  createIntegrationTestForComponentGroup: (...args: unknown[]) =>
    mockCreateIntegrationTestForComponentGroup(...args),
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

describe('IntegrationTestViewByGroup', () => {
  const mockNamespace = 'test-ns';
  const mockGroupName = 'test-group';

  mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({ groupName: mockGroupName });
  });

  it('should render IntegrationTestView with group breadcrumbs', () => {
    routerRenderer(<IntegrationTestViewByGroup />);

    expect(screen.getByTestId('integration-test-view')).toBeInTheDocument();
    const props = getViewProps();
    expect(props.breadcrumbs).toEqual([
      { name: 'Groups', path: '/groups' },
      expect.objectContaining({ name: 'Integration tests' }),
    ]);
    expect(props.breadcrumbs[1].path).toContain(mockGroupName);
  });

  it('should pass listPath and detailsPath for the group', () => {
    const integrationTest: IntegrationTestScenarioKind = {
      ...MockIntegrationTestsWithGit[0],
      metadata: { ...MockIntegrationTestsWithGit[0].metadata, name: 'group-test-1' },
    };
    routerRenderer(<IntegrationTestViewByGroup integrationTest={integrationTest} />);

    const props = getViewProps();
    expect(props.listPath).toContain(mockGroupName);
    expect(props.detailsPath).toContain('group-test-1');
  });

  it('should use the group context as default selected option', () => {
    routerRenderer(<IntegrationTestViewByGroup />);

    const props = getViewProps();
    expect(props.defaultSelectedContextOption).toEqual(
      expect.objectContaining({ name: 'group', selected: true }),
    );
  });

  it('should delegate createIntegrationTest with groupName and namespace', async () => {
    routerRenderer(<IntegrationTestViewByGroup />);

    const props = getViewProps();
    const formValues = { name: 'new-group-test' };
    mockCreateIntegrationTestForComponentGroup.mockResolvedValue({ metadata: {}, spec: {} });

    await props.createIntegrationTest(formValues);

    expect(mockCreateIntegrationTestForComponentGroup).toHaveBeenCalledWith(
      formValues,
      mockGroupName,
      mockNamespace,
    );
  });

  it('should wire track events for add and edit flows', () => {
    const integrationTest: IntegrationTestScenarioKind = MockIntegrationTestsWithGit[0];
    routerRenderer(<IntegrationTestViewByGroup integrationTest={integrationTest} />);

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
