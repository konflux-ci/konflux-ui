import {
  extractPageContext,
  PAGE_CONTEXT_MAX_TOTAL_CHARS,
  pageContextToAttachments,
  truncateText,
} from '~/components/AIChat/page-context';

const createPage = (innerHTML: string): HTMLElement => {
  const root = document.createElement('div');
  root.innerHTML = `<main class="pf-v6-c-page__main">${innerHTML}</main>`;
  document.body.appendChild(root);
  return root;
};

describe('page-context', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.body.innerHTML = '';
    document.title = originalTitle;
  });

  describe('truncateText', () => {
    it('should return the original string when it fits', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('should append a truncation marker when the string exceeds the limit', () => {
      const result = truncateText('abcdefghijklmnopqrstuvwxyz', 20);
      expect(result.endsWith('[truncated]')).toBe(true);
      expect(result.length).toBe(20);
    });
  });

  describe('extractPageContext', () => {
    it('should extract visible logs, tables, and pipeline status from the page', () => {
      document.title = 'Pipeline run details';
      const root = createPage(`
        <h1>build-pipeline-abc</h1>
        <span class="status-icon-with-text">Succeeded</span>
        <table>
          <tr><th>Name</th><th>Status</th></tr>
          <tr><td>task-a</td><td>Succeeded</td></tr>
        </table>
        <div class="log-content__row-content">ERROR: step failed</div>
        <div class="log-content__row-content">INFO: retrying</div>
      `);

      const context = extractPageContext(root);

      expect(context.title).toBe('Pipeline run details');
      expect(context.heading).toBe('build-pipeline-abc');
      expect(context.pipelineStatus).toContain('Succeeded');
      expect(context.tables).toContain('| Name | Status |');
      expect(context.tables).toContain('| task-a | Succeeded |');
      expect(context.logs).toContain('ERROR: step failed');
      expect(context.logs).toContain('INFO: retrying');
    });

    it('should ignore content inside the AI chat dock', () => {
      const root = createPage(`
        <div class="konflux-ai-chat">
          <table><tr><td>chat table</td></tr></table>
          <div class="log-content__row-content">chat log</div>
          <span class="status-icon-with-text">chat status</span>
        </div>
        <span class="status-icon-with-text">Failed</span>
      `);

      const context = extractPageContext(root);

      expect(context.tables).toBe('');
      expect(context.logs).toBe('');
      expect(context.pipelineStatus).toBe('Failed');
    });

    it('should skip hidden log rows', () => {
      const root = createPage(`
        <div class="log-content__row-content" style="visibility: hidden">hidden log</div>
        <div class="log-content__row-content" hidden>also hidden</div>
        <div class="log-content__row-content">visible log</div>
      `);

      expect(extractPageContext(root).logs).toBe('visible log');
    });

    it('should fall back to log viewer list items when row content is absent', () => {
      const root = createPage(`
        <div class="pf-v6-c-log-viewer__list-item">pod log line</div>
      `);

      expect(extractPageContext(root).logs).toBe('pod log line');
    });
  });

  describe('pageContextToAttachments', () => {
    it('should omit empty sections', () => {
      expect(
        pageContextToAttachments({
          url: '',
          title: '',
          heading: '',
          logs: '',
          tables: '',
          pipelineStatus: '',
        }),
      ).toEqual([]);
    });

    it('should map page sections to Lightspeed log attachments', () => {
      const attachments = pageContextToAttachments({
        url: 'https://konflux.example/ns/app',
        title: 'Components',
        heading: 'my-app',
        logs: 'boom',
        tables: '| Name |\n| --- |\n| comp-a |',
        pipelineStatus: 'Running',
      });

      expect(attachments.length).toBe(4);
      expect(attachments.every((attachment) => attachment.attachment_type === 'log')).toBe(true);
      expect(attachments.every((attachment) => attachment.content_type === 'text/plain')).toBe(
        true,
      );
      expect(attachments.map((attachment) => attachment.content).join('\n')).toContain('Running');
      expect(attachments.map((attachment) => attachment.content).join('\n')).toContain('boom');
    });

    it('should keep the combined attachment payload within the total size budget', () => {
      const oversizedLogs = 'x'.repeat(PAGE_CONTEXT_MAX_TOTAL_CHARS * 2);
      const attachments = pageContextToAttachments({
        url: 'https://example.test',
        title: 'Huge logs',
        heading: 'run',
        logs: oversizedLogs,
        tables: 'y'.repeat(PAGE_CONTEXT_MAX_TOTAL_CHARS),
        pipelineStatus: 'Failed',
      });

      const totalChars = attachments.reduce(
        (sum, attachment) => sum + attachment.content.length,
        0,
      );
      expect(totalChars).toBeLessThanOrEqual(PAGE_CONTEXT_MAX_TOTAL_CHARS);
      expect(attachments.some((attachment) => attachment.content.includes('[truncated]'))).toBe(
        true,
      );
    });
  });
});
