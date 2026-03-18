import { mockRoleBinding, mockRoleBindingsWithMultipleUsers } from '~/__data__/rolebinding-data';
import {
  expandRoleBindingsToTableRows,
  filterUserAccessRowsByUsername,
} from '../userAccessTableRows';

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

  describe('filterUserAccessRowsByUsername', () => {
    it('returns rows matching subject name', () => {
      const rows = expandRoleBindingsToTableRows(mockRoleBindingsWithMultipleUsers);
      const filtered = filterUserAccessRowsByUsername(rows, 'user2');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].subject?.name).toBe('user2');
    });
  });
});
