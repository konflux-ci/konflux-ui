import '@testing-library/jest-dom';
import { defaultKonfluxRoleMap } from '../../../../__data__/role-data';
import { mockRoleBinding } from '../../../../__data__/rolebinding-data';
import { K8sQueryDeleteResource } from '../../../../k8s';
import { RoleBindingModel } from '../../../../models';
import { NamespaceRole } from '../../../../types';
import { createK8sUtilMock } from '../../../../utils/test-utils';
import { createRBs, editRB, deleteRB } from '../form-utils';

const k8sCreateMock = createK8sUtilMock('K8sQueryCreateResource');
const k8sGetMock = createK8sUtilMock('K8sQueryListResourceItems');
const k8sDeleteMock = createK8sUtilMock('K8sQueryDeleteResource');

afterEach(() => {
  jest.clearAllMocks();
});

describe('createRBs', () => {
  it('should create RBs with sanitized username for all users', async () => {
    k8sCreateMock.mockImplementation((obj) => obj.resource);
    const result = await createRBs(
      {
        usernames: ['-Uuser1@!#123', 'user2-$~+.', 'user3_//-'],
        role: 'Maintainer',
        roleMap: defaultKonfluxRoleMap,
      },
      'test-ns',
    );
    expect(k8sCreateMock).toHaveBeenCalledTimes(3);
    // We give up expect(result).toEqual and expect.objectContaining() here.
    // Because althrough we use expect.objectContaining(), removing some items
    // of roleRef still make test fail.
    const expectedResult = [
      { 'uuser1---123': '-Uuser1@!#123' },
      { user2: 'user2-$~+.' },
      { user3: 'user3_//-' },
    ].map((userObj) => {
      const [sanitizedName, rawName] = Object.entries(userObj)[0]; // 解构键值对，获取键和值

      return {
        ...mockRoleBinding,
        metadata: {
          ...mockRoleBinding.metadata,
          name: sanitizedName,
        },
        subjects: mockRoleBinding.subjects.map((subject) => ({
          ...subject,
          name: rawName,
        })),
        roleRef: { ...mockRoleBinding.roleRef, name: 'konflux-maintainer-user-actions' },
      };
    });
    expect(result).toEqual(expectedResult);
  });

  test('should fail if RoleBinding already exists', async () => {
    k8sCreateMock.mockRejectedValueOnce(
      new Error('rolebindings.rbac.authorization.k8s.io "my1" already exists'),
    );

    await expect(
      createRBs(
        {
          usernames: ['user1', 'user2', 'user3'],
          role: 'Maintainer',
          roleMap: defaultKonfluxRoleMap,
        },
        'test-ns',
      ),
    ).rejects.toThrow('rolebindings.rbac.authorization.k8s.io "my1" already exists');
  });
});

describe('editRBs', () => {
  it('should replace the old role with new role', async () => {
    k8sCreateMock.mockImplementation((obj) => obj.resource);

    const values = {
      usernames: ['user1'],
      role: 'admin' as NamespaceRole,
      roleMap: defaultKonfluxRoleMap,
    };

    k8sGetMock.mockResolvedValue([mockRoleBinding]);
    k8sDeleteMock.mockImplementation();
    // There is one bug for K8sQueryDeleteResource. When the dryRun is true, it would
    // also delete resources. So we test dryRun as true for successfuly deletion.
    const result = await editRB(values, mockRoleBinding, true);

    expect(k8sDeleteMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      expect.objectContaining({
        ...mockRoleBinding,
        metadata: {
          ...mockRoleBinding.metadata,
          name: `user1`,
        },
        subjects: mockRoleBinding.subjects.map((subject) => ({
          ...subject,
          name: 'user1',
        })),
        roleRef: { ...mockRoleBinding.roleRef, name: 'konflux-admin-user-actions' },
      }),
    ]);
  });

  it('should handle errors from k8sCreateMock gracefully', async () => {
    const values = {
      usernames: ['user1'],
      role: 'admin' as NamespaceRole,
      roleMap: defaultKonfluxRoleMap,
    };
    k8sGetMock.mockResolvedValue([mockRoleBinding]);
    k8sCreateMock.mockRejectedValueOnce(new Error('Create failed'));

    await expect(editRB(values, mockRoleBinding)).rejects.toThrow('Create failed');

    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    // If users cannot be created successfully, we do not delete existing roles.
    // In this way, it looks like users does not edit roles successfuly.
    expect(k8sDeleteMock).toHaveBeenCalledTimes(0);
  });
});

// There is one bug for K8sQueryDeleteResource. When the dryRun is true, it would
// also delete resources. So we test dryRun as true for successfuly deletion.
describe('deleteRB', () => {
  it('should call K8sQueryDeleteResource with correct parameters when dryRun is true', async () => {
    k8sDeleteMock.mockResolvedValueOnce(undefined);

    await deleteRB(mockRoleBinding, true);

    expect(K8sQueryDeleteResource).toHaveBeenCalledTimes(1);
    expect(K8sQueryDeleteResource).toHaveBeenCalledWith({
      model: RoleBindingModel,
      queryOptions: {
        name: 'metadata-name',
        ns: 'test-ns',
        queryParams: { dryRun: 'All' },
      },
    });
  });

  it('should not call K8sQueryDeleteResource when dryRun is not passed', async () => {
    k8sDeleteMock.mockResolvedValueOnce(undefined);

    await deleteRB(mockRoleBinding);

    expect(K8sQueryDeleteResource).toHaveBeenCalledTimes(0);
  });

  it('should throw an error if K8sQueryDeleteResource fails', async () => {
    k8sDeleteMock.mockReset();
    k8sDeleteMock.mockRejectedValueOnce(new Error('Failed to delete'));

    await expect(deleteRB(mockRoleBinding, true)).rejects.toThrow('Failed to delete');
  });
});
