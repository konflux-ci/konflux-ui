import { fireEvent, screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { startNewBuildV2 } from '~/utils/component-utils';
import ComponentListActionCell from '../ComponentListActionCell';

const showModalMock = jest.fn();

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => ({
  useNamespace: () => 'test-namespace',
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: () => [true, true],
}));

jest.mock('~/utils/component-utils', () => ({
  startNewBuildV2: jest.fn(),
}));

jest.mock('~/shared/components/modal/ModalProvider', () => ({
  useModalLauncher: () => showModalMock,
}));

describe('ComponentListActionCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openMenuAndClick = async (label: string) => {
    fireEvent.click(screen.getByTestId('kebab-button'));
    fireEvent.click(await screen.findByText(label));
  };

  it('should start a build for the single version when a version is given', async () => {
    (startNewBuildV2 as jest.Mock).mockResolvedValue(undefined);
    renderWithQueryClientAndRouter(<ComponentListActionCell componentName="comp" version="v1" />);

    await openMenuAndClick('Start new build');

    expect(startNewBuildV2).toHaveBeenCalledWith('test-namespace', 'comp', ['v1']);
    expect(showModalMock).not.toHaveBeenCalled();
  });

  it('should open the version picker modal when no version is given', async () => {
    renderWithQueryClientAndRouter(<ComponentListActionCell componentName="comp" />);

    await openMenuAndClick('Start new build');

    expect(showModalMock).toHaveBeenCalledTimes(1);
    expect(startNewBuildV2).not.toHaveBeenCalled();
  });
});
