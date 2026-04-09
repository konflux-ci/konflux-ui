import { mockRoleBinding, mockRoleBindingsWithMultipleUsers } from '~/__data__/rolebinding-data';
import { expandRoleBindingsToTableRows, filterUserAccessRows } from '../userAccessTableRows';

describe('userAccessTableRows', () => {
  describe('expandRoleBindingsToTableRows', () => {
    it('creates one row per subject on the same role binding', () => {
      const rows = expandRoleBindingsToTableRows(mockRoleBindingsWithMultipleUsers);
      expect(rows).toHaveLength(2);
      expect(rows[0].subject?.name).toBe('user1');
      expect(rows[1].subject?.name).toBe('user2');
      expect(rows[0].roleBinding.metadata.name).toBe(rows[1].roleBinding.metadata.name);
    });

    it('creates a single row with null subject when subjects missing', () => {
      const rows = expandRoleBindingsToTableRows([{ ...mockRoleBinding, subjects: undefined }]);
      expect(rows).toHaveLength(1);
      expect(rows[0].subject).toBeNull();
    });
  });

  describe('filterUserAccessRows', () => {
    it('returns rows matching subject name when filtering by username', () => {
      const rows = expandRoleBindingsToTableRows(mockRoleBindingsWithMultipleUsers);
      const filtered = filterUserAccessRows(rows, { username: 'user2' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].subject?.name).toBe('user2');
    });

    it('returns all subject rows for bindings whose name matches', () => {
      const rows = expandRoleBindingsToTableRows(mockRoleBindingsWithMultipleUsers);
      const filtered = filterUserAccessRows(rows, { roleBindingName: 'konflux-contributor-user1' });
      expect(filtered).toHaveLength(2);
    });
  });
});
