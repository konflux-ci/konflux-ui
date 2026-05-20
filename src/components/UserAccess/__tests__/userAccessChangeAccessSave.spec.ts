import { defaultKonfluxRoleMap } from '~/__data__/role-data';
import { mockSingleSubjectRoleBinding } from '~/__data__/rolebinding-data';
import { createK8sUtilMock } from '~/unit-test-utils';
import {
  performUserAccessRoleChange,
  snapshotChangeAccessSaveContext,
  userHasRoleBindingOutsideDeletions,
} from '../userAccessChangeAccessSave';

const k8sCreateMock = createK8sUtilMock('K8sQueryCreateResource');
const k8sDeleteMock = createK8sUtilMock('K8sQueryDeleteResource');

afterEach(() => {
  jest.clearAllMocks();
});

describe('snapshotChangeAccessSaveContext', () => {
  it('copies selection and bindings so later mutations do not affect the snapshot', () => {
    const binding = mockSingleSubjectRoleBinding(
      'konflux-contributor-alice-user-actions',
      'alice',
      'konflux-contributor-user-actions',
    );
    const rowKey = 'konflux-contributor-user-actions__0__User__alice__rb-alice';
    const selectedRowKeys = new Set([rowKey]);
    const roleBindings = [binding];

    const snapshot = snapshotChangeAccessSaveContext(selectedRowKeys, roleBindings);

    selectedRowKeys.add('other-key');
    binding.subjects?.push({
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'bob',
    });

    expect(snapshot.selectedRowKeys).toEqual(new Set([rowKey]));
    expect(snapshot.roleBindings[0].subjects).toHaveLength(1);
    expect(snapshot.roleBindings[0].subjects?.[0]?.name).toBe('alice');
  });
});

describe('userHasRoleBindingOutsideDeletions', () => {
  const contributorRef = 'konflux-contributor-user-actions';

  it('returns true when user has the role on a binding not being deleted', () => {
    const aliceStandalone = mockSingleSubjectRoleBinding(
      'konflux-contributor-alice-user-actions',
      'alice',
      contributorRef,
    );
    const shared = {
      ...mockSingleSubjectRoleBinding('rb-shared', 'bob', contributorRef),
      subjects: [
        { apiGroup: 'rbac.authorization.k8s.io', kind: 'User' as const, name: 'alice' },
        { apiGroup: 'rbac.authorization.k8s.io', kind: 'User' as const, name: 'bob' },
      ],
    };
    expect(
      userHasRoleBindingOutsideDeletions(
        'alice',
        contributorRef,
        [aliceStandalone, shared],
        [shared],
      ),
    ).toBe(true);
  });
});

describe('performUserAccessRoleChange', () => {
  const namespace = 'test-ns';
  const currentRoleMap = defaultKonfluxRoleMap.roleMap as Record<
    string,
    'Admin' | 'Contributor' | 'Maintainer'
  >;

  it('creates new bindings before deleting old ones', async () => {
    const oldBinding = mockSingleSubjectRoleBinding(
      'konflux-contributor-alice-user-actions',
      'alice',
      'konflux-contributor-user-actions',
      namespace,
    );
    const newBinding = mockSingleSubjectRoleBinding(
      'konflux-admin-alice-user-actions',
      'alice',
      'konflux-admin-user-actions',
      namespace,
    );

    k8sCreateMock.mockImplementation((req: { resource: unknown }) => req.resource);
    k8sDeleteMock.mockResolvedValue(undefined);

    const callOrder: string[] = [];
    k8sCreateMock.mockImplementation(() => {
      callOrder.push('create');
      return newBinding;
    });
    k8sDeleteMock.mockImplementation(() => {
      callOrder.push('delete');
      return undefined;
    });

    const onSuccessClearSelection = jest.fn();
    await performUserAccessRoleChange({
      newRoleRef: 'konflux-admin-user-actions',
      selectedRowKeys: new Set(['konflux-contributor-user-actions__0__User__alice__rb-alice']),
      roleBindings: [oldBinding],
      currentRoleMap,
      roleMap: defaultKonfluxRoleMap,
      namespace,
      onSuccessClearSelection,
    });

    expect(callOrder).toEqual(['create', 'delete']);
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sDeleteMock).toHaveBeenCalledTimes(1);
    expect(onSuccessClearSelection).toHaveBeenCalledTimes(1);
  });

  it('rolls back created bindings when delete fails', async () => {
    const oldBinding = mockSingleSubjectRoleBinding(
      'konflux-contributor-alice-user-actions',
      'alice',
      'konflux-contributor-user-actions',
      namespace,
    );

    k8sCreateMock.mockImplementation((req: { resource: unknown }) => req.resource);
    k8sDeleteMock.mockRejectedValueOnce(new Error('Delete failed'));

    await expect(
      performUserAccessRoleChange({
        newRoleRef: 'konflux-admin-user-actions',
        selectedRowKeys: new Set(['konflux-contributor-user-actions__0__User__alice__rb-alice']),
        roleBindings: [oldBinding],
        currentRoleMap,
        roleMap: defaultKonfluxRoleMap,
        namespace,
        onSuccessClearSelection: jest.fn(),
      }),
    ).rejects.toThrow('Delete failed');

    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sDeleteMock).toHaveBeenCalledTimes(2);
  });

  it('does not recreate preserved role for user who already has it outside affected bindings', async () => {
    const contributorRef = 'konflux-contributor-user-actions';
    const aliceStandalone = mockSingleSubjectRoleBinding(
      'konflux-contributor-alice-user-actions',
      'alice',
      contributorRef,
    );
    const shared = {
      ...mockSingleSubjectRoleBinding('rb-shared', 'bob', contributorRef),
      subjects: [
        { apiGroup: 'rbac.authorization.k8s.io', kind: 'User' as const, name: 'alice' },
        { apiGroup: 'rbac.authorization.k8s.io', kind: 'User' as const, name: 'bob' },
      ],
    };

    k8sCreateMock.mockImplementation((req: { resource: unknown }) => req.resource);
    k8sDeleteMock.mockResolvedValue(undefined);

    await performUserAccessRoleChange({
      newRoleRef: 'konflux-maintainer-user-actions',
      selectedRowKeys: new Set([`${contributorRef}__1__User__bob__rb-shared`]),
      roleBindings: [aliceStandalone, shared],
      currentRoleMap,
      roleMap: defaultKonfluxRoleMap,
      namespace,
      onSuccessClearSelection: jest.fn(),
    });

    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    const created = (
      k8sCreateMock.mock.calls[0][0] as { resource: { subjects?: { name: string }[] } }
    ).resource;
    expect(created.subjects?.[0]?.name).toBe('bob');
    expect(k8sDeleteMock).toHaveBeenCalledTimes(1);
    expect(k8sDeleteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({ name: 'rb-shared' }),
      }),
    );
  });
});
