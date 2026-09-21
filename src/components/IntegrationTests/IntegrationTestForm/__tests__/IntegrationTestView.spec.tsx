import { screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { mockApplication } from '~/components/ApplicationDetails/__data__/mock-data';
import { MockComponents } from '~/components/Commits/CommitDetails/visualization/__data__/MockCommitWorkflowData';
import {
  MockIntegrationTests,
  MockIntegrationTestsWithGit,
} from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { defaultSelectedContextOption } from '~/components/IntegrationTests/utils/creation-utils';
import { useApplications } from '~/hooks/useApplications';
import { useComponents } from '~/hooks/useComponents';
import { NamespaceContext } from '~/shared/providers/Namespace/namespace-context';
import {
  createK8sWatchResourceMock,
  createReactRouterMock,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import IntegrationTestView, { FormContext, getFormContextValues } from '../IntegrationTestView';
import { editIntegrationTest } from '../utils/create-utils';

jest.mock('~/utils/analytics');

const watchResourceMock = createK8sWatchResourceMock();
const useNavigateMock = createReactRouterMock('useNavigate');
const navigateMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../utils/create-utils.ts', () => {
  const actual = jest.requireActual('../utils/create-utils.ts');
  return {
    ...actual,
    editIntegrationTest: jest.fn(),
  };
});

jest.mock('~/hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  // Used in ContextsField
  useComponents: jest.fn(),
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const editIntegrationTestMock = editIntegrationTest as jest.Mock;
const mockUseComponents = useComponents as jest.Mock;

class MockResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = MockResizeObserver;

const IntegrationTestViewWrapper = ({ children }) => (
  <NamespaceContext.Provider
    value={{
      namespace: 'test-ns',
      lastUsedNamespace: 'test-ns',
      namespaceResource: undefined,
      namespacesLoaded: true,
      namespaces: [],
    }}
  >
    {children}
  </NamespaceContext.Provider>
);

const useApplicationsMock = useApplications as jest.Mock;

const createTrackEvents = () => ({
  editIntegrationTestSubmit: jest.fn(),
  addIntegrationTestSubmit: jest.fn(),
  integrationTestEditedOrCreated: jest.fn(),
  editIntegrationTestLeave: jest.fn(),
  addIntegrationTestLeave: jest.fn(),
});

const defaultViewProps = (overrides = {}) => ({
  breadcrumbs: [],
  detailsPath: '/details/test-app-test-2',
  listPath: '/tests',
  trackEvents: createTrackEvents(),
  createIntegrationTest: jest.fn().mockResolvedValue({ metadata: {}, spec: {} }),
  defaultSelectedContextOption: defaultSelectedContextOption as FormContext,
  ...overrides,
});

describe('IntegrationTestView', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigateMock.mockReturnValue(navigateMock);
    useApplicationsMock.mockReturnValue([[mockApplication], true]);
    watchResourceMock.mockReturnValue([[], true]);
    mockUseComponents.mockReturnValue([MockComponents, true]);
  });

  it('should init values from provided integration test', async () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps({ integrationTest })} />,
      </IntegrationTestViewWrapper>,
    );

    const radioGroup = screen.getByLabelText('Pipeline');
    await user.click(radioGroup);

    expect(wrapper.getByLabelText(/Integration test name/).getAttribute('value')).toBe(
      'test-app-test-2',
    );

    expect(wrapper.getByLabelText(/Git Repository URL/).getAttribute('value')).toEqual('test-url2');
    expect(wrapper.getByLabelText(/Revision/).getAttribute('value')).toEqual('main2');

    expect(wrapper.getByLabelText(/Path in the repository/).getAttribute('value')).toEqual(
      'test-path2',
    );
  });

  const fillIntegrationTestForm = async (wrapper: RenderResult) => {
    fireEvent.input(wrapper.getByLabelText(/Integration test name/), {
      target: { value: 'new-test-name' },
    });
    const radioGroup = screen.getByLabelText('Pipeline Run');
    await user.click(radioGroup);

    fireEvent.input(wrapper.getByLabelText(/Git Repository URL/), {
      target: { value: 'quay.io/kpavic/test-bundle:pipeline' },
    });
    fireEvent.input(wrapper.getByLabelText(/Revision/), {
      target: { value: 'new-test-pipeline' },
    });
    fireEvent.input(wrapper.getByLabelText(/Path in the repository/), {
      target: { value: 'new-test-pipeline' },
    });
  };

  it('should render the form by default', async () => {
    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps()} />
      </IntegrationTestViewWrapper>,
    );
    expect(wrapper).toBeTruthy();

    const radioGroup = screen.getByLabelText('Pipeline');
    await user.click(radioGroup);
    wrapper.getByLabelText(/Integration test name/);
    wrapper.getByLabelText(/Git Repository URL/);
    wrapper.getByLabelText(/Revision/);
    wrapper.getByLabelText(/Path in the repository/);
    wrapper.getByRole('button', { name: 'Add integration test' });
  });

  it('should enable the submit button when there are no errors', async () => {
    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps()} />
      </IntegrationTestViewWrapper>,
    );
    expect(wrapper).toBeTruthy();

    const submitButton = wrapper.getByRole('button', { name: 'Add integration test' });
    expect(submitButton).toBeDisabled();
    await fillIntegrationTestForm(wrapper);
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('should call the injected createIntegrationTest and navigate to listPath on submit', async () => {
    const createIntegrationTestMock = jest
      .fn()
      .mockResolvedValue({ metadata: { name: 'new-test' }, spec: { application: 'test-app' } });
    const trackEvents = createTrackEvents();
    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView
          {...defaultViewProps({ createIntegrationTest: createIntegrationTestMock, trackEvents })}
        />
      </IntegrationTestViewWrapper>,
    );

    await fillIntegrationTestForm(wrapper);

    const submitButton = wrapper.getByRole('button', { name: 'Add integration test' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createIntegrationTestMock).toHaveBeenCalledTimes(1);
    });
    expect(createIntegrationTestMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'new-test-name' }),
    );
    expect(trackEvents.addIntegrationTestSubmit).toHaveBeenCalledTimes(1);
    expect(trackEvents.integrationTestEditedOrCreated).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/tests');
  });

  it('should call editIntegrationTest and navigate to detailsPath on edit submit', async () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    const editedTest = {
      ...integrationTest,
      metadata: { ...integrationTest.metadata, name: 'test-app-test-2' },
    };
    editIntegrationTestMock.mockResolvedValue(editedTest);
    const trackEvents = createTrackEvents();
    // no browser history to go back to, so it should navigate to detailsPath
    Object.defineProperty(window, 'history', {
      value: { ...window.history, state: { idx: 0 } },
      writable: true,
    });

    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps({ integrationTest, trackEvents })} />
      </IntegrationTestViewWrapper>,
    );

    fireEvent.input(wrapper.getByLabelText(/Revision/), {
      target: { value: 'updated-revision' },
    });

    const submitButton = wrapper.getByRole('button', { name: 'Save changes' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitFor(() => {
      expect(editIntegrationTestMock).toHaveBeenCalledTimes(1);
    });
    expect(trackEvents.editIntegrationTestSubmit).toHaveBeenCalledTimes(1);
    expect(trackEvents.integrationTestEditedOrCreated).toHaveBeenCalledWith(editedTest);
    expect(navigateMock).toHaveBeenCalledWith('/details/test-app-test-2');
  });

  it('should navigate back when history exists on edit submit', async () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    editIntegrationTestMock.mockResolvedValue(integrationTest);
    Object.defineProperty(window, 'history', {
      value: { ...window.history, state: { idx: 1 } },
      writable: true,
    });

    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps({ integrationTest })} />
      </IntegrationTestViewWrapper>,
    );

    fireEvent.input(wrapper.getByLabelText(/Revision/), {
      target: { value: 'another-revision' },
    });

    await user.click(wrapper.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(editIntegrationTestMock).toHaveBeenCalledTimes(1);
    });
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('should track leave and navigate back on cancel in create mode', async () => {
    const trackEvents = createTrackEvents();
    renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps({ trackEvents })} />
      </IntegrationTestViewWrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(trackEvents.addIntegrationTestLeave).toHaveBeenCalledTimes(1);
    expect(trackEvents.editIntegrationTestLeave).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('should track leave and navigate back on cancel in edit mode', async () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    const trackEvents = createTrackEvents();
    renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps({ integrationTest, trackEvents })} />
      </IntegrationTestViewWrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(trackEvents.editIntegrationTestLeave).toHaveBeenCalledTimes(1);
    expect(trackEvents.addIntegrationTestLeave).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('should be in edit mode', () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    const wrapper = renderWithQueryClientAndRouter(
      <IntegrationTestViewWrapper>
        <IntegrationTestView {...defaultViewProps({ integrationTest })} />
      </IntegrationTestViewWrapper>,
    );

    expect(wrapper.getByText(/Save changes/).closest('button')).toBeDisabled();
    wrapper.getByLabelText(/Integration test name/).setAttribute('value', 'new value');
  });
});

describe('getFormContextValues', () => {
  const applicationDefault = defaultSelectedContextOption as FormContext;
  const groupDefault = {
    name: 'group',
    description: 'execute the integration test for a Snapshot of the `group` type',
    selected: true,
  };

  it('should return the provided default context when creating an integration test', () => {
    expect(getFormContextValues(null, applicationDefault)).toEqual([applicationDefault]);
    expect(getFormContextValues(undefined, groupDefault)).toEqual([groupDefault]);
  });

  it('should return the integration test contexts', () => {
    const integrationTest = MockIntegrationTests[2];
    const result = getFormContextValues(integrationTest, applicationDefault);
    expect(result).toEqual([
      {
        description: 'Application testing 3',
        name: 'application',
      },
      {
        description: 'Group testing 3',
        name: 'group',
      },
    ]);
  });

  it('should return an empty array when the integration test has no contexts', () => {
    const integrationTest = MockIntegrationTestsWithGit[2];
    expect(getFormContextValues(integrationTest, applicationDefault)).toEqual([]);
  });
});
