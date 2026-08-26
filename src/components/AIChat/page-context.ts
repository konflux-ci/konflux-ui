import type { Attachment } from '@redhat-cloud-services/lightspeed-client';

/** Lightspeed allows 100_000 chars per attachment; stay well under to limit prompt size. */
export const PAGE_CONTEXT_MAX_TOTAL_CHARS = 24_000;

const PAGE_META_MAX_CHARS = 1_500;
const PIPELINE_STATUS_MAX_CHARS = 2_500;
const TABLES_MAX_CHARS = 8_000;
const LOGS_MAX_CHARS = 12_000;

const TRUNCATION_MARKER = '\n\n[truncated]';

const CHAT_ROOT_SELECTOR = '.konflux-ai-chat';
const PAGE_MAIN_SELECTOR = '.pf-v6-c-page__main';
const LOG_ROW_SELECTOR = '.log-content__row-content';
const LOG_ITEM_FALLBACK_SELECTOR = '.pf-v6-c-log-viewer__list-item';
const STATUS_SELECTOR = '.status-icon-with-text, [data-test*="status"]';

export type ExtractedPageContext = {
  url: string;
  title: string;
  heading: string;
  logs: string;
  tables: string;
  pipelineStatus: string;
};

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const isExcluded = (element: Element): boolean => {
  if (element.closest(CHAT_ROOT_SELECTOR)) {
    return true;
  }
  if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
    return true;
  }
  const style = element.getAttribute('style') ?? '';
  return /visibility\s*:\s*hidden/i.test(style);
};

const getVisibleText = (element: Element): string => {
  if (isExcluded(element)) {
    return '';
  }
  return collapseWhitespace(element.textContent ?? '');
};

export const truncateText = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) {
    return value;
  }
  const sliceLength = Math.max(0, maxChars - TRUNCATION_MARKER.length);
  return `${value.slice(0, sliceLength)}${TRUNCATION_MARKER}`;
};

export const getPageRoot = (root: ParentNode = document): ParentNode => {
  const main = root.querySelector(PAGE_MAIN_SELECTOR);
  return main ?? root;
};

const extractHeading = (pageRoot: ParentNode): string => {
  const heading = pageRoot.querySelector('h1');
  return heading ? getVisibleText(heading) : '';
};

const extractVisibleLogs = (pageRoot: ParentNode): string => {
  const rowContent = pageRoot.querySelectorAll(LOG_ROW_SELECTOR);
  const logElements =
    rowContent.length > 0 ? rowContent : pageRoot.querySelectorAll(LOG_ITEM_FALLBACK_SELECTOR);

  const lines = Array.from(logElements)
    .filter((element) => !isExcluded(element))
    .map((element) => collapseWhitespace(element.textContent ?? ''))
    .filter(Boolean);

  return Array.from(new Set(lines)).join('\n');
};

const escapeCell = (value: string): string =>
  collapseWhitespace(value).replace(/\|/g, '\\|');

const tableToMarkdown = (table: HTMLTableElement): string => {
  if (isExcluded(table)) {
    return '';
  }

  const rows = Array.from(table.querySelectorAll('tr')).filter((row) => !isExcluded(row));
  if (rows.length === 0) {
    return '';
  }

  const lines: string[] = [];
  rows.forEach((row, index) => {
    const cells = Array.from(row.querySelectorAll('th, td')).map((cell) =>
      escapeCell(cell.textContent ?? ''),
    );
    if (cells.length === 0) {
      return;
    }
    lines.push(`| ${cells.join(' | ')} |`);
    if (index === 0) {
      lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
    }
  });

  return lines.join('\n');
};

const extractVisibleTables = (pageRoot: ParentNode): string =>
  Array.from(pageRoot.querySelectorAll('table'))
    .map((table) => tableToMarkdown(table))
    .filter(Boolean)
    .join('\n\n');

const extractPipelineStatus = (pageRoot: ParentNode): string => {
  const lines = Array.from(pageRoot.querySelectorAll(STATUS_SELECTOR))
    .map((element) => getVisibleText(element))
    .filter(Boolean);

  return Array.from(new Set(lines)).join('\n');
};

export const extractPageContext = (root: ParentNode = document): ExtractedPageContext => {
  const pageRoot = getPageRoot(root);

  return {
    url: typeof window === 'undefined' ? '' : window.location.href,
    title: typeof document === 'undefined' ? '' : document.title,
    heading: extractHeading(pageRoot),
    logs: extractVisibleLogs(pageRoot),
    tables: extractVisibleTables(pageRoot),
    pipelineStatus: extractPipelineStatus(pageRoot),
  };
};

const toAttachment = (
  attachmentType: 'log' | 'configuration',
  contentType: 'text/plain' | 'application/yaml',
  content: string,
  maxChars: number,
): Attachment | undefined => {
  const trimmed = content.trim();
  if (!trimmed) {
    return undefined;
  }

  return {
    attachment_type: attachmentType,
    content_type: contentType,
    content: truncateText(trimmed, maxChars),
  };
};

const buildPageMetaContent = (context: ExtractedPageContext): string => {
  const lines = [
    context.title ? `Title: ${context.title}` : '',
    context.heading ? `Heading: ${context.heading}` : '',
    context.url ? `URL: ${context.url}` : '',
  ].filter(Boolean);

  return lines.join('\n');
};

/**
 * Convert extracted page context into Lightspeed attachments, each truncated
 * so the combined payload stays within {@link PAGE_CONTEXT_MAX_TOTAL_CHARS}.
 */
export const pageContextToAttachments = (context: ExtractedPageContext): Attachment[] => {
  const attachments = [
    toAttachment('log', 'text/plain', buildPageMetaContent(context), PAGE_META_MAX_CHARS),
    toAttachment(
      'log',
      'text/plain',
      context.pipelineStatus,
      PIPELINE_STATUS_MAX_CHARS,
    ),
    toAttachment('log', 'text/plain', context.tables, TABLES_MAX_CHARS),
    toAttachment('log', 'text/plain', context.logs, LOGS_MAX_CHARS),
  ].filter((attachment): attachment is Attachment => attachment !== undefined);

  let remaining = PAGE_CONTEXT_MAX_TOTAL_CHARS;
  return attachments
    .map((attachment) => {
      if (remaining <= 0) {
        return undefined;
      }
      const content = truncateText(attachment.content, remaining);
      remaining -= content.length;
      return { ...attachment, content };
    })
    .filter((attachment): attachment is Attachment => Boolean(attachment?.content));
};
