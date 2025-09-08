import { K8sQueryCreateResource, K8sQueryDeleteResource } from '~/k8s';
import { RoleBindingModel } from '~/models';
import { RoleBinding } from '~/types';
import {
  PUBLIC_ROLE_BINDING_NAME,
  VIEWER_ROLE_NAME,
  findPublicRoleBinding,
  createPublicRoleBinding,
  deletePublicRoleBinding,
} from '../namespace-visibility-utils';

// Mock the K8s operations
jest.mock('~/k8s', () => ({
  K8sQueryCreateResource: jest.fn(),
  K8sQueryDeleteResource: jest.fn(),
}));

const mockK8sQueryCreateResource = K8sQueryCreateResource as jest.MockedFunction<
  typeof K8sQueryCreateResource
>;
const mockK8sQueryDeleteResource = K8sQueryDeleteResource as jest.MockedFunction<
  typeof K8sQueryDeleteResource
>;

describe('namespace-visibility-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constants', () => {
    it('should export the correct constants', () => {
      expect(PUBLIC_ROLE_BINDING_NAME).toBe('konflux-public-viewer');
      expect(VIEWER_ROLE_NAME).toBe('konflux-viewer-user-actions');
    });
  });

  describe('findPublicRoleBinding', () => {
    const publicRoleBinding: RoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: 'konflux-public-viewer',
        namespace: 'test-namespace',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'konflux-viewer-user-actions',
      },
      subjects: [
        {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'system:authenticated',
        },
      ],
    };

    const privateRoleBinding: RoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: 'some-other-role-binding',
        namespace: 'test-namespace',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'some-other-role',
      },
      subjects: [
        {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'test-user',
        },
      ],
    };

    it('should find the public role binding when present', () => {
      const roleBindings = [privateRoleBinding, publicRoleBinding];
      const result = findPublicRoleBinding(roleBindings);
      expect(result).toBe(publicRoleBinding);
    });

    it('should return undefined when public role binding is not present', () => {
      const roleBindings = [privateRoleBinding];
      const result = findPublicRoleBinding(roleBindings);
      expect(result).toBeUndefined();
    });

    it('should return undefined when roleBindings is undefined', () => {
      const result = findPublicRoleBinding(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined when roleBindings is empty', () => {
      const result = findPublicRoleBinding([]);
      expect(result).toBeUndefined();
    });
  });

  describe('createPublicRoleBinding', () => {
    it('should create a public role binding with correct structure', async () => {
      const mockCreatedRoleBinding: RoleBinding = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'RoleBinding',
        metadata: {
          name: 'konflux-public-viewer',
          namespace: 'test-namespace',
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
          name: 'konflux-viewer-user-actions',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'system:authenticated',
          },
        ],
      };

      mockK8sQueryCreateResource.mockResolvedValue(mockCreatedRoleBinding);

      const result = await createPublicRoleBinding('test-namespace');

      expect(mockK8sQueryCreateResource).toHaveBeenCalledWith({
        model: RoleBindingModel,
        resource: mockCreatedRoleBinding,
        queryOptions: {
          ns: 'test-namespace',
        },
      });

      expect(result).toBe(mockCreatedRoleBinding);
    });

    it('should throw error when K8s operation fails', async () => {
      const error = new Error('Failed to create role binding');
      mockK8sQueryCreateResource.mockRejectedValue(error);

      await expect(createPublicRoleBinding('test-namespace')).rejects.toThrow(error);
    });
  });

  describe('deletePublicRoleBinding', () => {
    const mockRoleBinding: RoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: 'konflux-public-viewer',
        namespace: 'test-namespace',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'konflux-viewer-user-actions',
      },
      subjects: [
        {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'system:authenticated',
        },
      ],
    };

    it('should delete the role binding with correct parameters', async () => {
      mockK8sQueryDeleteResource.mockResolvedValue(undefined);

      await deletePublicRoleBinding('test-namespace', mockRoleBinding);

      expect(mockK8sQueryDeleteResource).toHaveBeenCalledWith({
        model: RoleBindingModel,
        queryOptions: {
          name: 'konflux-public-viewer',
          ns: 'test-namespace',
        },
      });
    });

    it('should throw error when K8s operation fails', async () => {
      const error = new Error('Failed to delete role binding');
      mockK8sQueryDeleteResource.mockRejectedValue(error);

      await expect(deletePublicRoleBinding('test-namespace', mockRoleBinding)).rejects.toThrow(
        error,
      );
    });
  });
});
