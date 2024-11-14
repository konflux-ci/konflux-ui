import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react-hooks';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { createUseWorkspaceInfoMock } from '../../../utils/test-utils';
import { useSBRActions } from '../user-access-actions';

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

const accessReviewMock = useAccessReviewForModel as jest.Mock;

describe('useSBRActions', () => {
  createUseWorkspaceInfoMock({ workspace: 'test-ws' });

  beforeEach(() => {
    accessReviewMock.mockReturnValue([true, true]);
  });

  it('should return enabled actions', () => {
    const { result } = renderHook(() =>
      useSBRActions({
        availableActions: ['update', 'delete'],
        masterUserRecord: 'my-user',
        role: 'admin',
        bindingRequest: { name: 'my-sbr', namespace: 'my-ns' },
      }),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Edit access',
        disabled: false,
        cta: {
          href: '/workspaces/test-ws/access/edit/my-user',
        },
      }),
    );

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Revoke access',
        disabled: false,
      }),
    );
  });

  it('should return disabled actions due to access', () => {
    accessReviewMock.mockReturnValue([false, true]);
    const { result } = renderHook(() =>
      useSBRActions({
        availableActions: [],
        masterUserRecord: 'my-user',
        role: 'admin',
        bindingRequest: { name: 'my-sbr', namespace: 'my-ns' },
      }),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Edit access',
        disabled: true,
        disabledTooltip: "You don't have permission to edit access",
      }),
    );
    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Revoke access',
        disabled: true,
        disabledTooltip: "You don't have permission to revoke access",
      }),
    );
  });

  it('should return disabled actions if binding request is not provided', () => {
    const { result } = renderHook(() =>
      useSBRActions({
        availableActions: ['update', 'delete'],
        masterUserRecord: 'my-user',
        role: 'admin',
      }),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Edit access',
        disabled: true,
      }),
    );
    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Revoke access',
        disabled: true,
      }),
    );
  });
});
