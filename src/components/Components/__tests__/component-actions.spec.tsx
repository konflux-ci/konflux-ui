import { useNavigate } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { COMPONENT_LIST_PATH } from '../../../routes/paths';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useModalLauncher } from '../../modal/ModalProvider';
import { componentDeleteModal } from '../../modal/resource-modals';
import { componentCRMocks, mockedActions } from '../__data__/mock-data';
import { useComponentActions } from '../component-actions';

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});
jest.mock('../../modal/resource-modals', () => {
  const actual = jest.requireActual('../../modal/resource-modals');
  return {
    ...actual,
    componentDeleteModal: jest.fn((...args: unknown[]) =>
      (actual as { componentDeleteModal: (...a: unknown[]) => unknown }).componentDeleteModal(
        ...args,
      ),
    ),
  };
});
jest.mock('../../modal/ModalProvider', () => ({
  ...jest.requireActual('../../modal/ModalProvider'),
  useModalLauncher: jest.fn(() =>
    jest.fn(() => ({ closed: Promise.resolve({ submitClicked: false }) })),
  ),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const componentDeleteModalMock = componentDeleteModal as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;

const mockedComponent = componentCRMocks[0];

const normalizeCta = (cta) =>
  typeof cta === 'function'
    ? expect.any(Function)
    : expect.objectContaining({ href: expect.any(String) });

const normalizeMockedActions = (disabled = false, includeManagedLinkedSecrets = true) =>
  mockedActions
    .filter((ma) => includeManagedLinkedSecrets || ma.label !== 'Manage linked secrets')
    .map(({ cta, ...rest }) =>
      expect.objectContaining({ ...rest, cta: normalizeCta(cta), disabled }),
    );

describe('component-actions', () => {
  describe('useComponentActions', () => {
    beforeEach(() => {
      useAccessReviewForModelMock.mockReturnValue([true, true]);
    });

    it('should contain all actions', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(expect.arrayContaining(normalizeMockedActions()));
    });

    it('actions should be disabled when user does not have access rights', () => {
      useAccessReviewForModelMock.mockReturnValue([false, false]);
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(expect.arrayContaining(normalizeMockedActions(true)));
    });

    it('should hide "Manage linked secrets" action if feature flag is disabled', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(expect.arrayContaining(normalizeMockedActions(false, false)));
    });

    it('should return empty array if component is null or undefined', () => {
      const { result } = renderHook(() =>
        useComponentActions(undefined, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual([]);
    });

    it('should navigate to component list when delete modal closes with submitClicked true', async () => {
      const navigateMock = jest.fn();
      useNavigateMock.mockReturnValue(navigateMock);
      const showModalMock = jest.fn(() => ({
        closed: Promise.resolve({ submitClicked: true }),
      }));
      useModalLauncherMock.mockReturnValue(showModalMock);
      mockUseNamespaceHook(mockedComponent.metadata?.namespace ?? '');
      componentDeleteModalMock.mockClear();

      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata?.name ?? ''),
      );
      const deleteAction = result.current.find((a) => a.label === 'Delete component');
      expect(deleteAction).toBeDefined();
      expect(typeof deleteAction?.cta).toBe('function');

      (deleteAction?.cta as () => void)();

      expect(componentDeleteModalMock).toHaveBeenCalledTimes(1);
      expect(componentDeleteModalMock).toHaveBeenCalledWith(mockedComponent);
      const expectedPath = COMPONENT_LIST_PATH.createPath({
        applicationName: mockedComponent.spec.application,
        workspaceName: mockedComponent.metadata?.namespace,
      });
      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expectedPath));
    });

    it('should not navigate when delete modal closes with submitClicked false', async () => {
      const navigateMock = jest.fn();
      useNavigateMock.mockReturnValue(navigateMock);
      const showModalMock = jest.fn(() => ({
        closed: Promise.resolve({ submitClicked: false }),
      }));
      useModalLauncherMock.mockReturnValue(showModalMock);

      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata?.name ?? ''),
      );
      const deleteAction = result.current.find((a) => a.label === 'Delete component');
      expect(deleteAction).toBeDefined();

      (deleteAction?.cta as () => void)();

      expect(showModalMock).toHaveBeenCalled();
      await Promise.resolve(); // allow .closed.then callback to run
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
