import { screen, fireEvent, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { useApplications } from '../../../../hooks/useApplications';
import { useComponents } from '../../../../hooks/useComponents';
import { NamespaceContext } from '../../../../shared/providers/Namespace/namespace-context';
import { createK8sWatchResourceMock, renderWithQueryClient } from '../../../../utils/test-utils';
import { mockApplication } from '../../../ApplicationDetails/__data__/mock-data';
import { MockComponents } from '../../../Commits/CommitDetails/visualization/__data__/MockCommitWorkflowData';
import {
  MockIntegrationTests,
  MockIntegrationTestsWithGit,
} from '../../IntegrationTestsListView/__data__/mock-integration-tests';
import IntegrationTestView, { getFormContextValues } from '../IntegrationTestView';
import { createIntegrationTest } from '../utils/create-utils';

jest.mock('../../../../utils/analytics');

const watchResourceMock = createK8sWatchResourceMock();

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({})),
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: () => navigateMock,
  useParams: jest.fn(() => ({
    appName: 'test-app',
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../utils/create-utils.ts', () => {
  const actual = jest.requireActual('../utils/create-utils.ts');
  return {
    ...actual,
    createIntegrationTest: jest.fn(),
  };
});

jest.mock('../../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  // Used in ContextsField
  useComponents: jest.fn(),
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const createIntegrationTestMock = createIntegrationTest as jest.Mock;
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

describe('IntegrationTestView', () => {
  const user = userEvent.setup();

  it('should init values from provided integration test', async () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    const wrapper = renderWithQueryClient(
      <IntegrationTestViewWrapper>
        <IntegrationTestView applicationName="test-app" integrationTest={integrationTest} />,
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
  beforeEach(() => {
    useApplicationsMock.mockReturnValue([[mockApplication], true]);
    watchResourceMock.mockReturnValue([[], true]);
    mockUseComponents.mockReturnValue([MockComponents, true]);
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
    const wrapper = renderWithQueryClient(
      <IntegrationTestViewWrapper>
        <IntegrationTestView applicationName="test-app" />
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

  it('should enable the submit button when there are no errors', () => {
    const wrapper = renderWithQueryClient(
      <IntegrationTestViewWrapper>
        <IntegrationTestView applicationName="test-app" />
      </IntegrationTestViewWrapper>,
    );
    expect(wrapper).toBeTruthy();

    const submitButton = wrapper.getByRole('button', { name: 'Add integration test' });
    expect(submitButton).toBeDisabled();
    void fillIntegrationTestForm(wrapper);
    expect(submitButton).toBeEnabled();
  });

  it('should navigate to the integration test tab on submit', () => {
    createIntegrationTestMock.mockImplementation(() =>
      Promise.resolve({
        metadata: {},
        spec: {},
      }),
    );
    const wrapper = renderWithQueryClient(
      <IntegrationTestViewWrapper>
        <IntegrationTestView applicationName="test-app" />
      </IntegrationTestViewWrapper>,
    );
    expect(wrapper).toBeTruthy();

    void fillIntegrationTestForm(wrapper);

    const submitButton = wrapper.getByRole('button', { name: 'Add integration test' });
    expect(submitButton).toBeTruthy();
    expect(submitButton).toBeEnabled();
  });

  it('should be in edit mode', () => {
    const integrationTest = MockIntegrationTestsWithGit[1];
    const wrapper = renderWithQueryClient(
      <IntegrationTestViewWrapper>
        <IntegrationTestView applicationName="test-app" integrationTest={integrationTest} />
      </IntegrationTestViewWrapper>,
    );

    expect((wrapper.getByText(/Save changes/) as HTMLButtonElement).disabled).toBe(true);
    wrapper.getByLabelText(/Integration test name/).setAttribute('value', 'new value');
  });
});

describe('getFormContextValues', () => {
  it('should return default context when creating an integration test', () => {
    const result = getFormContextValues(null);
    expect(result).toEqual([
      {
        name: 'application',
        description: 'execute the integration test in all cases - this would be the default state',
        selected: true,
      },
    ]);
  });

  it('should return the integration test contexts', () => {
    const integrationTest = MockIntegrationTests[2];
    const result = getFormContextValues(integrationTest);
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
});
