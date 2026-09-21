import { renderHook } from '@testing-library/react';
import {
  MockIntegrationTestsWithBundles,
  MockIntegrationTestsWithGit,
} from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '~/utils/rbac';
import { useModalLauncher } from '../../../modal/ModalProvider';
import { useIntegrationTestActions } from '../useIntegrationTestActions';

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => jest.fn()),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;

const gitIntegrationTest = MockIntegrationTestsWithGit[0];
const bundleIntegrationTest = MockIntegrationTestsWithBundles[0];

describe('useIntegrationTestActions', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    useModalLauncherMock.mockReturnValue(jest.fn());
  });

  it('should use the provided editPath for the Edit action', () => {
    const editPath = '/ns/test-ns/groups/test-group/integrationtests/group-test-1/edit';
    const { result } = renderHook(() => useIntegrationTestActions(gitIntegrationTest, editPath));

    const editAction = result.current.find((action) => action.label === 'Edit');
    expect(editAction).toEqual(expect.objectContaining({ cta: { href: editPath } }));
  });

  it('should pass through an application-scoped editPath unchanged', () => {
    const editPath = '/ns/test-ns/applications/test-app/integrationtests/test-app-test-1/edit';
    const { result } = renderHook(() => useIntegrationTestActions(gitIntegrationTest, editPath));

    const editAction = result.current.find((action) => action.label === 'Edit');
    expect(editAction.cta).toEqual({ href: editPath });
  });

  it('should enable Edit for GIT tests when the user has update access', () => {
    const { result } = renderHook(() => useIntegrationTestActions(gitIntegrationTest, '/edit'));

    const editAction = result.current.find((action) => action.label === 'Edit');
    expect(editAction.disabled).toBe(false);
  });

  it('should disable Edit for non-GIT tests', () => {
    const { result } = renderHook(() => useIntegrationTestActions(bundleIntegrationTest, '/edit'));

    const editAction = result.current.find((action) => action.label === 'Edit');
    expect(editAction.disabled).toBe(true);
  });

  it('should disable actions when the user lacks RBAC permissions', () => {
    useAccessReviewForModelMock.mockReturnValue([false, true]);
    const { result } = renderHook(() => useIntegrationTestActions(gitIntegrationTest, '/edit'));

    const editAction = result.current.find((action) => action.label === 'Edit');
    const deleteAction = result.current.find((action) => action.label === 'Delete');
    expect(editAction.disabled).toBe(true);
    expect(deleteAction.disabled).toBe(true);
  });

  it('should provide a Delete action that launches the delete modal', () => {
    const showModalMock = jest.fn();
    useModalLauncherMock.mockReturnValue(showModalMock);
    const { result } = renderHook(() => useIntegrationTestActions(gitIntegrationTest, '/edit'));

    const deleteAction = result.current.find((action) => action.label === 'Delete');
    expect(typeof deleteAction.cta).toBe('function');
    (deleteAction.cta as () => void)();
    expect(showModalMock).toHaveBeenCalledTimes(1);
  });
});
