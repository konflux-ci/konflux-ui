import { ISSUES_PATH, ISSUES_LIST_PATH } from '../paths';

describe('Issues Path Configuration', () => {
  describe('ISSUES_PATH', () => {
    it('should be defined', () => {
      expect(ISSUES_PATH).toBeDefined();
      expect(ISSUES_PATH.path).toBeDefined();
    });

    it('should have correct path structure', () => {
      expect(typeof ISSUES_PATH.path).toBe('string');
      expect(ISSUES_PATH.path).toMatch(/^ns\/.*\/issues$/);
    });

    it('should generate correct URLs', () => {
      const testWorkspace = 'test-workspace';
      const url = ISSUES_PATH.createPath({ workspaceName: testWorkspace });

      expect(url).toBe(`/ns/${testWorkspace}/issues`);
    });

    it('should be extendable', () => {
      expect(typeof ISSUES_PATH.extend).toBe('function');
    });
  });

  describe('ISSUES_LIST_PATH', () => {
    it('should be defined', () => {
      expect(ISSUES_LIST_PATH).toBeDefined();
      expect(ISSUES_LIST_PATH.path).toBeDefined();
    });

    it('should extend ISSUES_PATH with list segment', () => {
      expect(typeof ISSUES_LIST_PATH.path).toBe('string');
      expect(ISSUES_LIST_PATH.path).toMatch(/^ns\/.*\/issues\/list$/);
    });

    it('should generate correct URLs', () => {
      const testWorkspace = 'test-workspace';
      const url = ISSUES_LIST_PATH.createPath({ workspaceName: testWorkspace });

      expect(url).toBe(`/ns/${testWorkspace}/issues/list`);
    });

    it('should be related to ISSUES_PATH', () => {
      const testWorkspace = 'test-workspace';
      const issuesUrl = ISSUES_PATH.createPath({ workspaceName: testWorkspace });
      const listUrl = ISSUES_LIST_PATH.createPath({ workspaceName: testWorkspace });

      expect(listUrl).toBe(`${issuesUrl}/list`);
    });
  });

  describe('path consistency', () => {
    it('should handle different workspace names', () => {
      const workspaces = ['workspace-1', 'my-app', 'test-123'];

      workspaces.forEach((workspace) => {
        const issuesUrl = ISSUES_PATH.createPath({ workspaceName: workspace });
        const listUrl = ISSUES_LIST_PATH.createPath({ workspaceName: workspace });

        expect(issuesUrl).toBe(`/ns/${workspace}/issues`);
        expect(listUrl).toBe(`/ns/${workspace}/issues/list`);
      });
    });

    it('should maintain parent-child relationship', () => {
      const workspace = 'example-workspace';
      const parentUrl = ISSUES_PATH.createPath({ workspaceName: workspace });
      const childUrl = ISSUES_LIST_PATH.createPath({ workspaceName: workspace });

      expect(childUrl.startsWith(parentUrl)).toBe(true);
      expect(childUrl).toBe(`${parentUrl}/list`);
    });
  });
});
