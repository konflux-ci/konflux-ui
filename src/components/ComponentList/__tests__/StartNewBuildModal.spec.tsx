import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentKind } from '~/types';
import { startNewBuildV2 } from '~/utils/component-utils';
import { StartNewBuildModal } from '../StartNewBuildModal';

jest.mock('~/hooks/useComponentsV2', () => ({
  useComponentV2: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));

jest.mock('~/utils/component-utils', () => ({
  startNewBuildV2: jest.fn(),
}));

const mockComponent = {
  metadata: { name: 'test-component', namespace: 'test-namespace' },
  spec: {
    source: {
      url: 'https://github.com/org/repo',
      versions: [
        { name: 'v1', revision: 'main' },
        { name: 'v2', revision: 'main' },
      ],
    },
  },
} as unknown as ComponentKind;

describe('StartNewBuildModal', () => {
  const renderModal = (onClose: () => void) => {
    const { useComponentV2 } = jest.requireMock('~/hooks/useComponentsV2');
    useComponentV2.mockReturnValue([mockComponent, true, undefined]);
    return render(<StartNewBuildModal onClose={onClose} componentName="test-component" />);
  };

  const selectVersions = async (...versions: string[]) => {
    const user = userEvent.setup();
    await user.click(screen.getByText('Select versions'));
    for (const version of versions) {
      await user.click(screen.getByRole('checkbox', { name: new RegExp(version) }));
    }
    return user;
  };

  it('should disable the submit button when no versions are selected', () => {
    renderModal(() => {});

    expect(screen.getByRole('button', { name: 'Start build' })).toBeDisabled();
  });

  it('should start builds for all selected versions on submit', async () => {
    (startNewBuildV2 as jest.Mock).mockResolvedValue(undefined);
    const onClose = jest.fn();
    renderModal(onClose);

    const user = await selectVersions('v1', 'v2');
    await user.click(screen.getByRole('button', { name: 'Start build' }));

    expect(startNewBuildV2).toHaveBeenCalledWith('test-namespace', 'test-component', ['v1', 'v2']);
    expect(onClose).toHaveBeenCalled();
  });

  it('should remove a version from the selection via its chip', async () => {
    (startNewBuildV2 as jest.Mock).mockResolvedValue(undefined);
    renderModal(() => {});

    const user = await selectVersions('v1', 'v2');
    await user.click(screen.getByRole('button', { name: 'Close v1' }));
    await user.click(screen.getByRole('button', { name: 'Start build' }));

    expect(startNewBuildV2).toHaveBeenCalledWith('test-namespace', 'test-component', ['v2']);
  });

  it('should show an error and keep the modal open when the build request fails', async () => {
    (startNewBuildV2 as jest.Mock).mockRejectedValue(new Error('boom'));
    const onClose = jest.fn();
    renderModal(onClose);

    const user = await selectVersions('v1');
    await user.click(screen.getByRole('button', { name: 'Start build' }));

    expect(screen.getByTestId('start-build-error')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
