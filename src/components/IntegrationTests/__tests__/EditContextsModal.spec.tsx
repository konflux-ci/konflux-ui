import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useComponents } from '../../../hooks/useComponents';
import { k8sPatchResource } from '../../../k8s/k8s-fetch';
import { formikRenderer } from '../../../utils/test-utils';
import { EditContextsModal } from '../EditContextsModal';
import { IntegrationTestFormValues } from '../IntegrationTestForm/types';
import { MockIntegrationTests } from '../IntegrationTestsListView/__data__/mock-integration-tests';
import { contextOptions } from '../utils';

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
  contexts: intTest.spec.contexts,
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
    // Clear all selections
    fireEvent.click(clearButton);
    // Save button should now be active
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(patchResourceMock).toHaveBeenCalledTimes(1);
    });

    expect(patchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: { name: 'test-app-test-1', ns: 'test-namespace' },
        patches: [{ op: 'replace', path: '/spec/contexts', value: null }],
      }),
    );
    expect(onCloseMock).toHaveBeenCalledWith(null, { submitClicked: true });
  });

  it('displays an error message if k8sPatchResource fails', async () => {
    patchResourceMock.mockRejectedValue('Failed to update contexts');
    setup();

    const clearButton = screen.getByTestId('clear-button');
    // Clear all selections
    fireEvent.click(clearButton);
    // Click Save button
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // wait for the error message to appear
    await waitFor(() => {
      expect(patchResourceMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Failed to update contexts')).toBeInTheDocument();
    });
  });
});
