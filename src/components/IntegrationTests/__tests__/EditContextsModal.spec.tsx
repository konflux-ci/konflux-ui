import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useComponents } from '../../../hooks/useComponents';
import { k8sPatchResource } from '../../../k8s/k8s-fetch';
import {
  formikRenderer,
  openIntegrationTestContextDropdown,
  getIntegrationTestContextOptionButton,
} from '../../../utils/test-utils';
import { EditContextsModal } from '../EditContextsModal';
import { IntegrationTestFormValues } from '../IntegrationTestForm/types';
import { MockIntegrationTests } from '../IntegrationTestsListView/__data__/mock-integration-tests';
import { contextOptions } from '../utils/creation-utils';

// Mock external dependencies
jest.mock('../../../k8s/k8s-fetch', () => ({
  k8sPatchResource: jest.fn(),
}));
jest.mock('../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));
jest.mock('../../Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(() => ({ namespace: 'test-ns', workspace: 'test-ws' })),
}));

const useComponentsMock = useComponents as jest.Mock;
const patchResourceMock = k8sPatchResource as jest.Mock;
const onCloseMock = jest.fn();

const intTest = MockIntegrationTests[0];
const initialValues: IntegrationTestFormValues = {
  name: intTest.metadata.name,
  url: 'test-url',
  optional: true,
  contexts: contextOptions,
};

const setup = () =>
  formikRenderer(<EditContextsModal intTest={intTest} onClose={onCloseMock} />, initialValues);

beforeEach(() => {
  jest.clearAllMocks();
  useComponentsMock.mockReturnValue([[], true]);
});

describe('EditContextsModal', () => {
  it('should render correct contexts', () => {
    setup();
    const contextOptionNames = contextOptions.map((ctx) => ctx.name);

    screen.getByText('Contexts');
    contextOptionNames.forEach((ctxName) => screen.queryByText(ctxName));
  });

  it('should show Save and Cancel buttons', () => {
    setup();
    // Save
    screen.getByTestId('update-contexts');
    // Cancel
    screen.getByTestId('cancel-update-contexts');
  });

  it('should call onClose callback when cancel button is clicked', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCloseMock).toHaveBeenCalledWith(null, { submitClicked: false });
  });

  it('prevents form submission when pressing Enter', () => {
    setup();
    const form = screen.getByTestId('edit-contexts-modal');
    fireEvent.keyDown(form, { key: 'Enter', code: 'Enter' });
    expect(k8sPatchResource).not.toHaveBeenCalled();
  });

  it('calls updateIntegrationTest and onClose on form submission', async () => {
    patchResourceMock.mockResolvedValue({});

    setup();
    const clearButton = screen.getByTestId('clear-button');
    const submitButton = screen.getByTestId('update-contexts');
    // Clear all selections
    fireEvent.click(clearButton);
    // Save button should not be active
    // if no context values are selected.
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);

    // The user should not be able to update the contexts.
    await waitFor(() => {
      expect(patchResourceMock).toHaveBeenCalledTimes(0);
    });

    // Select a context
    await openIntegrationTestContextDropdown();
    const groupOption = getIntegrationTestContextOptionButton('group');
    /* eslint-disable-next-line @typescript-eslint/require-await */
    await act(async () => {
      fireEvent.click(groupOption);
    });

    // Submission should be available now
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(patchResourceMock).toHaveBeenCalledTimes(1);
    });

    expect(patchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1beta1',
          kind: 'IntegrationTestScenario',
          namespaced: true,
          plural: 'integrationtestscenarios',
        },
        patches: [
          {
            op: 'replace',
            path: '/spec/contexts',
            value: [
              {
                description: 'execute the integration test for a Snapshot of the `group` type',
                name: 'group',
              },
            ],
          },
        ],
        queryOptions: { name: 'test-app-test-1', ns: 'test-namespace' },
      }),
    );
    expect(onCloseMock).toHaveBeenCalledWith(null, { submitClicked: true });
  });

  it('displays an error message if k8sPatchResource fails', async () => {
    patchResourceMock.mockRejectedValue('Failed to update contexts');
    setup();

    const submitButton = screen.getByTestId('update-contexts');
    // Select a context
    await openIntegrationTestContextDropdown();
    const groupOption = getIntegrationTestContextOptionButton('group');
    /* eslint-disable-next-line @typescript-eslint/require-await */
    await act(async () => {
      fireEvent.click(groupOption);
    });

    // Click Save button
    fireEvent.click(submitButton);

    // wait for the error message to appear
    await waitFor(() => {
      expect(patchResourceMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Failed to update contexts')).toBeInTheDocument();
    });
  });
});
