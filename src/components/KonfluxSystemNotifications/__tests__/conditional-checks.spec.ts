import { checkAccess } from '~/utils/rbac';
import { checkIfSystemNotificationsAccessible } from '../conditional-checks';

jest.mock('~/utils/rbac', () => ({
  checkAccess: jest.fn(),
}));

const checkAccessMock = checkAccess as unknown as jest.Mock;

describe('checkIfSystemNotificationsAccessible', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when user has permission to list configmaps', async () => {
    checkAccessMock.mockResolvedValue({ status: { allowed: true } });

    const result = await checkIfSystemNotificationsAccessible();

    expect(result).toBe(true);
    expect(checkAccessMock).toHaveBeenCalledWith(
      '',
      'configmaps',
      undefined,
      'konflux-info',
      'list',
    );
  });

  it('should return false when user does not have permission', async () => {
    checkAccessMock.mockResolvedValue({ status: { allowed: false } });

    const result = await checkIfSystemNotificationsAccessible();

    expect(result).toBe(false);
  });

  it('should return false when status is missing', async () => {
    checkAccessMock.mockResolvedValue({});

    const result = await checkIfSystemNotificationsAccessible();

    expect(result).toBe(false);
  });

  it('should return false when checkAccess throws an error', async () => {
    checkAccessMock.mockRejectedValue(new Error('RBAC check failed'));

    const result = await checkIfSystemNotificationsAccessible();

    expect(result).toBe(false);
  });
});
