import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react-hooks';
import { SecretKind, SecretType } from '../../../types';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useSecretActions } from '../secret-actions';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => 'cta'),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;

describe('useSecretActions', () => {
  beforeEach(() => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
  });

  it('should contain trigger actions', () => {
    const { result } = renderHook(() =>
      useSecretActions({
        metadata: { name: 'test-secret' },
        type: SecretType.opaque,
      } as SecretKind),
    );
    const actions = result.current;

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Delete',
        disabledTooltip: "You don't have access to delete this secret",
        id: 'delete-test-secret',
        disabled: false,
      }),
    );
  });
});
