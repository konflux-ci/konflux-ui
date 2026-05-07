import { useNavigate } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { useURLForComponentPR } from '../../../hooks/useComponents';
import { COMPONENT_LIST_PATH } from '../../../routes/paths';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useModalLauncher } from '../../modal/ModalProvider';
import { componentDeleteModal } from '../../modal/resource-modals';
import { componentCRMocks } from '../__data__/mock-data';
import { useComponentActions } from '../component-actions';

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));
jest.mock('../../../hooks/useComponents', () => ({
  ...jest.requireActual('../../../hooks/useComponents'),
  useURLForComponentPR: jest.fn(),
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
const useURLForComponentPRMock = useURLForComponentPR as jest.Mock;
const componentDeleteModalMock = componentDeleteModal as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;

const mockedComponent = componentCRMocks[0];

const normalizeAction = (label: string, disabled = false) =>
  expect.objectContaining({
    label,
    cta: expect.anything(),
    disabled,
  });

describe('component-actions', () => {
  describe('useComponentActions', () => {
    beforeEach(() => {
      useAccessReviewForModelMock.mockReturnValue([true, true]);
      useURLForComponentPRMock.mockReturnValue('https://github.com/org/repo/pulls');
    });

    it('should contain all actions', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(
        expect.arrayContaining([
          normalizeAction('Edit build pipeline plan'),
          normalizeAction('Start new build'),
          normalizeAction('Manage linked secrets'),
          normalizeAction('View all pull requests'),
          normalizeAction('Delete component'),
        ]),
      );
    });

    it('actions should be disabled when user does not have access rights', () => {
      useAccessReviewForModelMock.mockReturnValue([false, false]);
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(
        expect.arrayContaining([
          normalizeAction('Edit build pipeline plan', true),
          normalizeAction('Start new build', true),
          normalizeAction('Manage linked secrets', true),
          normalizeAction('View all pull requests', true),
          normalizeAction('Delete component', true),
        ]),
      );
    });

    it('should include "Manage linked secrets" action', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions.find((a) => a.label === 'Manage linked secrets')).toBeDefined();
    });

    it('should set external cta for "View all pull requests"', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const prAction = result.current.find((a) => a.label === 'View all pull requests');
      expect(prAction?.cta).toEqual({ href: 'https://github.com/org/repo/pulls', external: true });
    });

    it('should disable "View all pull requests" when prURL is undefined', () => {
      useURLForComponentPRMock.mockReturnValue(undefined);
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const prAction = result.current.find((a) => a.label === 'View all pull requests');
      expect(prAction?.disabled).toBe(true);
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
