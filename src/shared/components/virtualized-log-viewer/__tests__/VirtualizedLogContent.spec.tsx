import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { VirtualizedLogContent } from '../VirtualizedLogContent';

// Mock lodash-es debounce to make tests synchronous
jest.mock('lodash-es', () => ({
  ...jest.requireActual('lodash-es'),
  debounce: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  },
}));

describe('VirtualizedLogContent Integration Tests', () => {
  const mockData = 'line 1\nline 2\nline 3';
  const defaultProps = {
    data: mockData,
    height: 600,
    width: '100%',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM dimensions for virtualization to work properly
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 800,
    });
  });

  describe('Rendering and Structure', () => {
    it('should render log content container with proper structure', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');

      expect(listElement).toBeInTheDocument();
    });

    it('should apply correct height and width styles', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} height={500} width={800} />,
      );

      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toHaveStyle({ height: '500px', width: '800px' });
    });

    it('should support percentage width', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} width="80%" />);

      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toHaveStyle({ width: '80%' });
    });

    it('should render measurement element for virtualization', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const measureElement = document.querySelector('.pf-v5-c-log-viewer__list-item');
      expect(measureElement).toBeInTheDocument();
      expect(measureElement).toHaveStyle({
        position: 'absolute',
        visibility: 'hidden',
      });
    });
  });

  describe('Virtualization Integration', () => {
    it('should render virtualized items with real virtualizer', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const items = document.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should apply positioning styles to virtual items', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const items = document.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      // Virtual items should have positioning (either absolute position or transform)
      const itemsWithPositioning = Array.from(items).filter((item) => {
        if (!(item instanceof HTMLElement)) return false;
        const hasAbsolutePosition = item.style.position === 'absolute';
        const hasTransform = item.style.transform && item.style.transform !== '';
        return hasAbsolutePosition || hasTransform;
      });
      expect(itemsWithPositioning.length).toBeGreaterThan(0);
    });

    it('should efficiently handle large datasets with virtualization', () => {
      const longData = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n');
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} data={longData} />);

      const items = document.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      // Should only render visible items, not all 1000
      expect(items.length).toBeLessThan(1000);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Log Line Rendering and Content', () => {
    it('should render plain text log lines', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const textElements = screen.getAllByText(/line \d/);
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('should render actual log content', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      expect(screen.getByText(/line 1/)).toBeInTheDocument();
      expect(screen.getByText(/line 2/)).toBeInTheDocument();
      expect(screen.getByText(/line 3/)).toBeInTheDocument();
    });

    it('should highlight even single character search', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="line 1\nline 2" searchText="l" />,
      );

      const marks = document.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      // Should match all occurrences of "l"
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should highlight search matches in log content', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="error on line 1" searchText="error" />,
      );

      const marks = document.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should mark current search match with pf-m-current class', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          data="error on line 1"
          searchText="error"
          currentSearchMatch={{ rowIndex: 0, matchIndex: 1 }}
        />,
      );

      const currentMark = document.querySelector('mark.pf-m-current');
      expect(currentMark).toBeInTheDocument();
    });

    it('should handle multiple matches in single line', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="error error error" searchText="error" />,
      );

      const marks = document.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBe(3);
    });

    it('should be case insensitive in search', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="ERROR Warning error" searchText="error" />,
      );

      const marks = document.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      // Should match both "ERROR" and "error"
      expect(marks.length).toBe(2);
    });

    it('should escape special regex characters in search', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          data="[error] normal error"
          searchText="[error]"
        />,
      );

      const marks = container.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      // Syntax highlighting may split "[error]" into multiple tokens, creating multiple marks
      // but the combined text should be "[error]" and should NOT match the standalone "error"
      expect(marks.length).toBeGreaterThan(0);
      const combinedText = Array.from(marks)
        .map((m) => m.textContent)
        .join('');
      expect(combinedText).toBe('[error]');

      // Verify standalone "error" is NOT matched
      const logText = container.querySelector('.pf-v5-c-log-viewer__list')?.textContent || '';
      expect(logText).toContain('normal error');
      // The word "error" after "normal" should not be highlighted
      const allText = Array.from(marks)
        .map((m) => m.textContent)
        .join('');
      expect(allText).not.toContain('normal');
    });

    it('should search "info" and match "INFO" (syntax highlighted token)', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="INFO: Server started" searchText="info" />,
      );

      const marks = container.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBeGreaterThan(0);

      // Verify the mark is inside a syntax token
      const infoToken = container.querySelector('.token.log-level-info');
      expect(infoToken).toBeInTheDocument();
      const markInsideToken = infoToken?.querySelector('mark.pf-m-match');
      expect(markInsideToken).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior Integration', () => {
    it('should integrate with useVirtualizedScroll hook', () => {
      const onScroll = jest.fn();

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} onScroll={onScroll} />,
      );

      // Component should render without errors
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should handle scrollToRow prop for scroll positioning', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} scrollToRow={5} />);

      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should work without onScroll callback', () => {
      expect(() => {
        renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Data Handling', () => {
    it('should handle empty data gracefully', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} data="" />);

      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should handle single line data', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="single line" />,
      );

      expect(screen.getByText('single line')).toBeInTheDocument();
    });

    it('should handle very long lines without breaking', () => {
      const longLine = 'a'.repeat(5000);
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} data={longLine} />);

      const textElement = document.querySelector('.pf-v5-c-log-viewer__text');
      expect(textElement).toBeInTheDocument();
    });

    it('should handle data with trailing newlines', () => {
      const dataWithNewlines = 'line 1\nline 2\n\n';

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={dataWithNewlines} />,
      );

      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();

      // Should render the lines
      expect(screen.getByText(/line 1/)).toBeInTheDocument();
      expect(screen.getByText(/line 2/)).toBeInTheDocument();
    });

    it('should handle special characters in log content', () => {
      const specialData = 'line with <html> tags\nline with & ampersand\nline with "quotes"';
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={specialData} />,
      );

      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement?.textContent).toContain('<html>');
      expect(listElement?.textContent).toContain('&');
      expect(listElement?.textContent).toContain('"quotes"');
    });
  });

  describe('ResizeObserver Error Suppression', () => {
    it('should suppress ResizeObserver errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const preventDefaultSpy = jest.fn();
      const stopImmediatePropagationSpy = jest.fn();

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      // Simulate ResizeObserver error with cancelable event
      const event = new ErrorEvent('error', {
        message: 'ResizeObserver loop completed with undelivered notifications',
        cancelable: true,
      });
      event.preventDefault = preventDefaultSpy;
      event.stopImmediatePropagation = stopImmediatePropagationSpy;

      window.dispatchEvent(event);

      // Error handler should prevent default and stop propagation
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopImmediatePropagationSpy).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should not suppress other errors', () => {
      const preventDefaultSpy = jest.fn();

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      // Simulate other error
      const event = new ErrorEvent('error', {
        message: 'Some other error',
        cancelable: true,
      });
      event.preventDefault = preventDefaultSpy;

      window.dispatchEvent(event);

      // Error handler should not be called for other errors
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Syntax Highlighting', () => {
    it('should apply syntax highlighting to log levels', () => {
      const logData = 'INFO: Server started\nERROR: Connection failed\nWARN: Low memory';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={logData} />,
      );

      // Check for log level tokens
      const infoToken = container.querySelector('.token.log-level-info');
      const errorToken = container.querySelector('.token.log-level-error');
      const warnToken = container.querySelector('.token.log-level-warn');

      expect(infoToken).toBeInTheDocument();
      expect(errorToken).toBeInTheDocument();
      expect(warnToken).toBeInTheDocument();
    });

    it('should apply syntax highlighting to timestamps', () => {
      const logData = '2026-02-02T10:52:23Z INFO: Message\n2026/02/02 10:30:45 DEBUG: Debug info';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={logData} />,
      );

      // Check for timestamp tokens
      const timestamps = container.querySelectorAll('.token.timestamp');
      expect(timestamps.length).toBeGreaterThanOrEqual(2);
    });

    it('should apply syntax highlighting to key=value pairs', () => {
      const logData = 'time="2026-02-02T10:52:23Z" level=info msg="test message"';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={logData} />,
      );

      // Check for key-value tokens
      const kvTokens = container.querySelectorAll('.token.key-value');
      expect(kvTokens.length).toBeGreaterThanOrEqual(3);

      // Check for key tokens inside key-value
      const keys = container.querySelectorAll('.token.key, .token.attr-name');
      expect(keys.length).toBeGreaterThanOrEqual(3);
    });

    it('should apply syntax highlighting to test results', () => {
      const logData = 'Test PASSED\nBuild FAILED\nValidation SUCCESS';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={logData} />,
      );

      // Check for result tokens
      const resultTokens = container.querySelectorAll('.token.result');
      expect(resultTokens.length).toBeGreaterThanOrEqual(2);

      // FAILED should be marked as error
      const errorTokens = container.querySelectorAll('.token.log-level-error');
      expect(errorTokens.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT highlight content inside quoted strings', () => {
      const logData =
        'url="https://example.com?searchType=containers" id="+XM+s3niWaEk1U5jnR5DpA=="';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={logData} />,
      );

      // url and id should be highlighted as keys
      const keys = container.querySelectorAll('.token.key, .token.attr-name');
      expect(keys.length).toBe(2);

      // searchType inside URL should NOT be highlighted as a separate key
      const allKvTokens = container.querySelectorAll('.token.key-value');
      expect(allKvTokens.length).toBe(2); // Only url= and id=
    });

    it('should combine syntax highlighting with search highlighting', () => {
      const logData = 'ERROR: Connection failed host=localhost';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={logData} searchText="ERROR" />,
      );

      // Should have both syntax highlighting token and search match
      const errorToken = container.querySelector('.token.log-level-error');
      expect(errorToken).toBeInTheDocument();

      // Should also have search match marker
      const searchMatch = container.querySelector('mark.pf-m-match');
      expect(searchMatch).toBeInTheDocument();
    });
  });
});
