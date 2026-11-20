import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { COMPONENT_LINKED_SECRETS_V2_PATH } from '~/routes/paths';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { startNewBuildV2 } from '~/utils/component-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import ComponentActionsCell from '../ComponentActionsCell';

const showModalMock = jest.fn();

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => ({
  useNamespace: () => 'test-namespace',
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

jest.mock('~/utils/component-utils', () => ({
  startNewBuildV2: jest.fn(),
}));

jest.mock('~/shared/components/modal/ModalProvider', () => ({
  useModalLauncher: () => showModalMock,
}));

describe('ComponentActionsCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccessReviewForModel as jest.Mock).mockImplementation(() => [true, true]);
  });

  const openMenuAndClick = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    await user.click(screen.getByTestId('kebab-button'));
    await user.click(await screen.findByText(label));
  };

  it('should start a build for the single version when a version is given', async () => {
    (startNewBuildV2 as jest.Mock).mockResolvedValue(undefined);
    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" version="v1" />);

    await openMenuAndClick(userEvent.setup(), 'Start new build');

    expect(startNewBuildV2).toHaveBeenCalledWith('test-namespace', 'comp', ['v1']);
    expect(showModalMock).not.toHaveBeenCalled();
  });

  it('should show an error modal when the direct build fails', async () => {
    (startNewBuildV2 as jest.Mock).mockRejectedValue(new Error('boom'));
    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" version="v1" />);

    await openMenuAndClick(userEvent.setup(), 'Start new build');

    expect(showModalMock).toHaveBeenCalledTimes(1);
    const errorModal = (
      showModalMock.mock.calls[0][0] as () => { props: { errorMessage?: string } }
    )();
    expect(errorModal.props.errorMessage).toBe('boom');
  });

  it('should open the version picker modal when no version is given', async () => {
    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" />);

    await openMenuAndClick(userEvent.setup(), 'Start new build');

    expect(showModalMock).toHaveBeenCalledTimes(1);
    expect(startNewBuildV2).not.toHaveBeenCalled();
  });

  it('should disable the start build action without patch permission', async () => {
    (useAccessReviewForModel as jest.Mock).mockImplementation(() => [false, true]);
    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" version="v1" />);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('kebab-button'));
    const item = await screen.findByText('Start new build');

    expect(item.closest('button')).toHaveAttribute('aria-disabled', 'true');
    await user.click(item);
    expect(startNewBuildV2).not.toHaveBeenCalled();
  });

  it('should render no actions when componentName is undefined', async () => {
    renderWithQueryClientAndRouter(<ComponentActionsCell />);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('kebab-button'));
    await waitFor(() => expect(screen.getByTestId('action-menu')).toBeInTheDocument());

    expect(screen.queryByText('Start new build')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage linked secrets')).not.toBeInTheDocument();
  });

  it('should navigate to linked secrets when manage linked secrets is clicked', async () => {
    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" />);

    await openMenuAndClick(userEvent.setup(), 'Manage linked secrets');

    expect(window.location.pathname).toBe(
      COMPONENT_LINKED_SECRETS_V2_PATH.createPath({
        workspaceName: 'test-namespace',
        componentName: 'comp',
      }),
    );
  });

  it('should use the provided label for the actions menu, falling back to the component name', () => {
    const { unmount } = renderWithQueryClientAndRouter(
      <ComponentActionsCell componentName="comp" version="v1" label="Actions for v1" />,
    );
    expect(screen.getByTestId('kebab-button')).toHaveAttribute('aria-label', 'Actions for v1');
    unmount();

    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" version="v1" />);
    expect(screen.getByTestId('kebab-button')).toHaveAttribute('aria-label', 'Actions for comp');
  });

  it('should disable the manage linked secrets action without service account patch permission', async () => {
    (useAccessReviewForModel as jest.Mock)
      .mockReturnValueOnce([false, true]) // ServiceAccountModel patch
      .mockReturnValueOnce([true, true]); // ComponentModelV2 patch
    renderWithQueryClientAndRouter(<ComponentActionsCell componentName="comp" />);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('kebab-button'));
    const item = await screen.findByText('Manage linked secrets');

    expect(item.closest('button')).toHaveAttribute('aria-disabled', 'true');
  });
});
