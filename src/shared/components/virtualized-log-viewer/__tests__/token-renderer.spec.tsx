import { render } from '@testing-library/react';
import Prism from 'prismjs';
import {
  renderTokenRecursive,
  renderTokenString,
  isUrlToken,
  getTokenHref,
} from '../token-renderer';

describe('token-renderer', () => {
  describe('isUrlToken', () => {
    it('should return true for token with type "url"', () => {
      const token = new Prism.Token('url', 'https://example.com');
      expect(isUrlToken(token)).toBe(true);
    });

    it('should return true for token with type "email"', () => {
      const token = new Prism.Token('email', 'user@example.com');
      expect(isUrlToken(token)).toBe(true);
    });

    it('should return true for token with alias "url"', () => {
      const token = new Prism.Token('email', 'user@example.com', 'url');
      expect(isUrlToken(token)).toBe(true);
    });

    it('should return true for token with alias array containing "url"', () => {
      const token = new Prism.Token('custom', 'value');
      token.alias = ['url', 'other'];
      expect(isUrlToken(token)).toBe(true);
    });

    it('should return false for non-url token', () => {
      const token = new Prism.Token('keyword', 'function');
      expect(isUrlToken(token)).toBe(false);
    });

    it('should return false for token with unrelated alias', () => {
      const token = new Prism.Token('string', 'hello', 'constant');
      expect(isUrlToken(token)).toBe(false);
    });
  });

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

    it('should not add mailto: for non-email text', () => {
      expect(getTokenHref('https://example.com')).toBe('https://example.com');
    });
  });

  describe('renderTokenString', () => {
    it('should render plain text without matches', () => {
      const { container } = render(<>{renderTokenString('hello world', 0, [], null)}</>);
      expect(container.textContent).toBe('hello world');
    });

    it('should render highlights for matching ranges', () => {
      const matches = [{ start: 6, end: 11 }];
      const { container } = render(
        <>{renderTokenString('hello world', 0, matches, null)}</>,
      );
      expect(container.textContent).toBe('hello world');
      const mark = container.querySelector('mark');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('world');
    });
  });

  describe('renderTokenRecursive', () => {
    it('should render a plain string token', () => {
      const { container } = render(
        <>{renderTokenRecursive('plain text', 0, [], null, 0)}</>,
      );
      expect(container.textContent).toBe('plain text');
    });

    it('should render a non-url token as a span', () => {
      const token = new Prism.Token('keyword', 'ERROR');
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0)}</>,
      );
      const span = container.querySelector('span.token.keyword');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
      expect(span?.textContent).toBe('ERROR');
    });

    it('should render a url token as an anchor element', () => {
      const token = new Prism.Token('url', 'https://pipeline.test/build/123');
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0)}</>,
      );
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('https://pipeline.test/build/123');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(anchor?.textContent).toBe('https://pipeline.test/build/123');
    });

    it('should render an email token with mailto href', () => {
      const token = new Prism.Token('email', 'user@pipeline.test', 'url');
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0)}</>,
      );
      const anchor = container.querySelector('a');
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute('href')).toBe('mailto:user@pipeline.test');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should preserve search highlights within URL anchors', () => {
      const token = new Prism.Token('url', 'https://pipeline.test/build/123');
      const matches = [{ start: 8, end: 16 }];
      const { container } = render(
        <>{renderTokenRecursive(token, 0, matches, null, 0)}</>,
      );
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
      const { container } = render(
        <>{renderTokenRecursive(token, 0, matches, currentMatch, 0)}</>,
      );
      const anchor = container.querySelector('a.token.url');
      const mark = anchor?.querySelector('mark.pf-m-current');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('pipeline');
    });

    it('should render url token with array content as an anchor', () => {
      const token = new Prism.Token('url', ['https://', 'example.com']);
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0)}</>,
      );
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
      expect(anchor?.getAttribute('href')).toBe('https://example.com');
      expect(anchor?.textContent).toBe('https://example.com');
    });

    it('should render url token with nested Token content as an anchor', () => {
      const inner = new Prism.Token('punctuation', '://');
      const token = new Prism.Token('url', inner);
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0)}</>,
      );
      const anchor = container.querySelector('a.token.url');
      expect(anchor).not.toBeNull();
      expect(anchor?.tagName).toBe('A');
    });

    it('should not render non-url token as an anchor', () => {
      const token = new Prism.Token('string', '"some text"');
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0)}</>,
      );
      expect(container.querySelector('a')).toBeNull();
      const span = container.querySelector('span.token.string');
      expect(span).not.toBeNull();
      expect(span?.tagName).toBe('SPAN');
    });

    it('should handle depth limit', () => {
      const token = new Prism.Token('url', 'https://example.com');
      const { container } = render(
        <>{renderTokenRecursive(token, 0, [], null, 0, 51)}</>,
      );
      expect(container.textContent).toBe('...');
    });
  });
});
