import { render } from '@testing-library/react';
import Prism from 'prismjs';
import { renderTokenRecursive, renderTokenString, getTokenHref } from '../token-renderer';

describe('token-renderer', () => {
  describe('getTokenHref', () => {
    it('should return the URL as-is for http URLs', () => {
      expect(getTokenHref('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should return the URL as-is for ftp URLs', () => {
      expect(getTokenHref('ftp://files.example.com')).toBe('ftp://files.example.com');
    });

    it('should return mailto: href for email addresses', () => {
      expect(getTokenHref('user@example.com')).toBe('mailto:user@example.com');
    });

    it('should extract email from surrounding sentence text', () => {
      expect(getTokenHref('Contact user@example.com')).toBe('mailto:user@example.com');
    });

    it('should not add mailto: for non-email text', () => {
      expect(getTokenHref('https://example.com')).toBe('https://example.com');
    });

    it('should not add mailto: for URLs containing @ characters', () => {
      expect(getTokenHref('https://token@github.com/repo.git')).toBe(
        'https://token@github.com/repo.git',
      );
    });

    it('should return empty string for javascript: scheme', () => {
      expect(getTokenHref('javascript:alert(1)')).toBe('');
    });

    it('should return empty string for data: scheme', () => {
      expect(getTokenHref('data:text/html,<h1>hi</h1>')).toBe('');
    });

    it('should return empty string for unknown schemes', () => {
      expect(getTokenHref('custom://something')).toBe('');
    });

    it('should not double-prefix mailto: URIs', () => {
      expect(getTokenHref('mailto:user@example.com')).toBe('mailto:user@example.com');
    });

    it('should reject email-like strings with query parameters', () => {
      expect(getTokenHref('user@example.com?subject=Urgent&body=Click')).toBe('');
    });

    it('should return empty string for SCP-style git URLs', () => {
      expect(getTokenHref('git@github.com:org/repo.git')).toBe('');
    });

    it('should strip query parameters from mailto: URIs', () => {
      expect(getTokenHref('mailto:user@example.com?subject=Urgent&body=Click')).toBe(
        'mailto:user@example.com',
      );
    });

    it('should extract the absolute URL from quoted token text', () => {
      expect(getTokenHref('"https://github.com"')).toBe('https://github.com');
      expect(getTokenHref("'https://github.com'")).toBe('https://github.com');
    });

    it('should extract the absolute URL from surrounding sentence text', () => {
      expect(getTokenHref('Visit https://github.com today')).toBe('https://github.com');
    });

    it('should extract the absolute URL from key=value token text', () => {
      expect(getTokenHref('url=https://github.com/org/repo')).toBe('https://github.com/org/repo');
    });

    it('should extract mailto from surrounding text and strip query params', () => {
      expect(getTokenHref('Contact mailto:user@example.com?subject=Hi')).toBe(
        'mailto:user@example.com',
      );
    });
  });

  describe('renderTokenString', () => {
    it('should render plain text without matches', () => {
      const { container } = render(<>{renderTokenString('hello world', 0, [], null)}</>);
      expect(container.textContent).toBe('hello world');
    });

    it('should render highlights for matching ranges', () => {
      const matches = [{ start: 6, end: 11 }];
      const { container } = render(<>{renderTokenString('hello world', 0, matches, null)}</>);
      expect(container.textContent).toBe('hello world');
      const mark = container.querySelector('mark');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('world');
    });
  });

  describe('renderTokenRecursive', () => {
    it('should render a plain string token', () => {
      const { container } = render(<>{renderTokenRecursive('plain text', 0, [], null, 0)}</>);
      expect(container.textContent).toBe('plain text');
    });

    it('should render a non-url token as a span', () => {
      const token = new Prism.Token('keyword', 'ERROR');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const span = container.querySelector('span.token.keyword');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
      expect(span?.textContent).toBe('ERROR');
    });

    it('should render a url token as an anchor element', () => {
      const token = new Prism.Token('url', 'https://pipeline.test/build/123');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('https://pipeline.test/build/123');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(anchor?.textContent).toBe('https://pipeline.test/build/123');
    });

    it('should render an email token with mailto href and no target=_blank', () => {
      const token = new Prism.Token('email', 'user@pipeline.test', 'url');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a');
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('href')).toBe('mailto:user@pipeline.test');
      expect(anchor?.getAttribute('target')).toBeNull();
      expect(anchor?.getAttribute('rel')).toBeNull();
    });

    it('should preserve search highlights within URL anchors', () => {
      const token = new Prism.Token('url', 'https://pipeline.test/build/123');
      const matches = [{ start: 8, end: 16 }];
      const { container } = render(<>{renderTokenRecursive(token, 0, matches, null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      const mark = anchor?.querySelector('mark');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('pipeline');
    });

    it('should highlight the current match within a URL anchor', () => {
      const token = new Prism.Token('url', 'https://pipeline.test/build/123');
      const currentMatch = { start: 8, end: 16 };
      const matches = [currentMatch];
      const { container } = render(<>{renderTokenRecursive(token, 0, matches, currentMatch, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      const mark = anchor?.querySelector('mark.pf-m-current');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('pipeline');
    });

    it('should render url token with array content as an anchor', () => {
      const token = new Prism.Token('url', ['https://', 'example.com']);
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('https://example.com');
      expect(anchor?.textContent).toBe('https://example.com');
    });

    it('should render url token with nested Token content as an anchor when href is valid', () => {
      const inner = new Prism.Token('content', 'https://example.com');
      const token = new Prism.Token('url', inner);
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('https://example.com');
    });

    it('should render url token with nested Token content as a span when href is invalid', () => {
      const inner = new Prism.Token('punctuation', '://');
      const token = new Prism.Token('url', inner);
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      expect(container.querySelector('a')).toBeNull();
      const span = container.querySelector('span.token.url');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
    });

    it('should not render non-url token as an anchor', () => {
      const token = new Prism.Token('string', '"some text"');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      expect(container.querySelector('a')).toBeNull();
      const span = container.querySelector('span.token.string');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
    });

    it('should render a URL with @ as an anchor with the correct href, not mailto', () => {
      const token = new Prism.Token('url', 'https://token@github.com/repo.git');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('href')).toBe('https://token@github.com/repo.git');
    });

    it('should render a url token with unsafe scheme as a span, not an anchor', () => {
      const token = new Prism.Token('url', 'javascript:alert(1)');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      expect(container.querySelector('a')).toBeNull();
      const span = container.querySelector('span.token.url');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
      expect(span?.textContent).toBe('javascript:alert(1)');
    });

    it('should render a string-type token with URL content as an anchor', () => {
      const token = new Prism.Token('string', 'https://pipeline.test/build/456');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.string');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('https://pipeline.test/build/456');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should render a string-type token with email content as an anchor', () => {
      const token = new Prism.Token('string', 'admin@pipeline.test');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.string');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('mailto:admin@pipeline.test');
    });

    it('should extract email href from a string token with surrounding text', () => {
      const token = new Prism.Token('string', 'Contact admin@pipeline.test');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.string');
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('href')).toBe('mailto:admin@pipeline.test');
      expect(anchor?.textContent).toBe('Contact admin@pipeline.test');
    });

    it('should render a container-image token as a span, not an anchor', () => {
      const token = new Prism.Token('container-image', 'quay.io/org/image:tag');
      token.alias = 'constant';
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      expect(container.querySelector('a')).toBeNull();
      const span = container.querySelector('span.token.container-image');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
      expect(span?.textContent).toBe('quay.io/org/image:tag');
    });

    it('should not produce nested anchor elements', () => {
      const inner = new Prism.Token('url', 'https://example.com');
      const token = new Prism.Token('url', inner);
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.querySelector('a')).toBeNull();
    });

    it('should render SCP-style git URL as a span, not an anchor', () => {
      const token = new Prism.Token('url', 'git@github.com:org/repo.git');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      expect(container.querySelector('a')).toBeNull();
      const span = container.querySelector('span.token.url');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
    });

    it('should include aria-label with new-tab indication on http anchors', () => {
      const token = new Prism.Token('url', 'https://example.com');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.url');
      expect(anchor?.getAttribute('aria-label')).toBe('https://example.com (opens in new tab)');
    });

    it('should include opens email client in aria-label for mailto anchors', () => {
      const token = new Prism.Token('email', 'user@example.com', 'url');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a');
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('aria-label')).toBe('user@example.com (opens email client)');
      expect(anchor?.getAttribute('aria-label')).not.toContain('opens in new tab');
    });

    it('should omit target=_blank and rel from mailto anchors', () => {
      const token = new Prism.Token('string', 'admin@pipeline.test');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0)}</>);
      const anchor = container.querySelector('a.token.string');
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('href')).toBe('mailto:admin@pipeline.test');
      expect(anchor?.getAttribute('target')).toBeNull();
      expect(anchor?.getAttribute('rel')).toBeNull();
      expect(anchor?.getAttribute('aria-label')).toBe('admin@pipeline.test (opens email client)');
    });

    it('should handle depth limit', () => {
      const token = new Prism.Token('url', 'https://example.com');
      const { container } = render(<>{renderTokenRecursive(token, 0, [], null, 0, 51)}</>);
      expect(container.textContent).toBe('...');
    });
  });
});
