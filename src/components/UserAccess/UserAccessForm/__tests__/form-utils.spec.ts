import '@testing-library/jest-dom';
import { defaultKonfluxRoleMap } from '../../../../__data__/role-data';
import { mockRoleBinding } from '../../../../__data__/rolebinding-data';
import { NamespaceRole } from '../../../../types';
import { createK8sUtilMock } from '../../../../utils/test-utils';
import { createRBs, editRB } from '../form-utils';

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
      { 'konflux-maintainer-uuser1---123-user-actions': '-Uuser1@!#123' },
      { 'konflux-maintainer-user2-user-actions': 'user2-$~+.' },
      { 'konflux-maintainer-user3-user-actions': 'user3_//-' },
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

    const result = await editRB(values, mockRoleBinding, true);

    expect(k8sDeleteMock).toHaveBeenCalledTimes(0);
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      expect.objectContaining({
        ...mockRoleBinding,
        metadata: {
          ...mockRoleBinding.metadata,
          name: `konflux-admin-user1-user-actions`,
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

    await expect(editRB(values, mockRoleBinding, true)).rejects.toThrow('Create failed');
    // error should be caught in creation during dry run
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    // delete should not be called during dry run
    expect(k8sDeleteMock).toHaveBeenCalledTimes(0);
  });
});
