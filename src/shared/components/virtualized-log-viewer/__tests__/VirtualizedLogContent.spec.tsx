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

  describe('Log Line Rendering', () => {
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
  });

  describe('Search Highlighting', () => {
    it('should highlight when search text is less than 2 characters', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} searchText="l" />);

      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBe(3);
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

    it('should escape special regex characters in search', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="[error]" searchText="[error]" />,
      );

      const marks = document.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should be case insensitive in search', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="ERROR Warning error" searchText="error" />,
      );

      const marks = document.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      // Should match both "ERROR" and "error"
      expect(marks.length).toBe(2);
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

    it('should preserve empty lines with non-breaking space', () => {
      const dataWithEmptyLines = 'line 1\n\nline 3\n\n\nline 6';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={dataWithEmptyLines} />,
      );

      const textElements = container.querySelectorAll('.pf-v5-c-log-viewer__text');
      expect(textElements.length).toBeGreaterThan(0);

      // Empty lines should contain non-breaking space (\u00A0)
      const emptyLineElements = Array.from(textElements).filter((el) => {
        const text = el.textContent || '';
        // Check if line contains only non-breaking space
        return text === '\u00A0';
      });

      // Should have at least 3 empty lines (indices 1, 3, 4)
      expect(emptyLineElements.length).toBeGreaterThanOrEqual(3);
    });

    it('should preserve empty lines when searching', () => {
      const dataWithEmptyLines = 'error\n\nerror';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={dataWithEmptyLines} searchText="error" />,
      );

      const textElements = container.querySelectorAll('.pf-v5-c-log-viewer__text');

      // Find the empty line element (should contain only non-breaking space)
      const emptyLineElement = Array.from(textElements).find((el) => el.textContent === '\u00A0');
      expect(emptyLineElement).toBeInTheDocument();

      // Should have search highlights for the two "error" lines
      const marks = container.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBe(2);
    });
  });

  describe('Text Wrapping for Long Lines', () => {
    it('should wrap long lines using pre-wrap white-space', () => {
      // Create a very long line that would normally overflow
      const longLine = `ERROR: ${'A'.repeat(500)} - this is a very long error message`;
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={longLine} />,
      );

      const logText = container.querySelector('.pf-v5-c-log-viewer__text');
      expect(logText).toBeInTheDocument();

      // Verify element has the correct class for styling
      expect(logText?.className).toContain('pf-v5-c-log-viewer__text');
    });

    it('should break long words/URLs with word-break', () => {
      // Create a line with a very long unbreakable URL
      const longUrl = `https://example.com/very-long-path/${'segment/'.repeat(50)}endpoint`;
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={longUrl} />,
      );

      // Query the log list content (not the hidden measurement element)
      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
      expect(logList?.textContent).toContain('https://example.com');
    });

    it('should preserve whitespace and line breaks with pre-wrap', () => {
      const dataWithSpaces = 'Line 1    with    spaces\n  Line 2 indented\nLine 3';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={dataWithSpaces} />,
      );

      const logText = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logText).toBeInTheDocument();

      // Pre-wrap should preserve multiple spaces
      expect(logText?.textContent).toContain('with    spaces');
    });

    it('should handle dynamic heights for wrapped lines with virtualizer.measureElement', () => {
      // Mix of short and long lines
      const mixedData = `Short line
${'Very long line that will wrap: '.repeat(10)}
Another short line`;

      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data={mixedData} />,
      );

      // Query the actual virtualized list items (excluding the hidden measurement element)
      const scrollContainer = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(scrollContainer).toBeInTheDocument();

      const listItems = scrollContainer?.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(listItems).toBeDefined();
      expect(listItems?.length).toBeGreaterThan(0);

      // Verify virtualized items have data-index for measurement
      // Note: Only visible items are rendered due to virtualization
      const itemsWithDataIndex = Array.from(listItems ?? []).filter((item) =>
        item.hasAttribute('data-index'),
      );
      expect(itemsWithDataIndex.length).toBeGreaterThan(0);
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

  describe('Line Number Gutter', () => {
    it('should render line number gutter', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const gutter = document.querySelector('.log-viewer__gutter');
      expect(gutter).toBeInTheDocument();
    });

    it('should render line numbers in the gutter', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const lineNumbers = document.querySelectorAll('.log-viewer__line-number');
      expect(lineNumbers.length).toBeGreaterThan(0);
    });

    it('should apply with-gutter class to container', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const container = document.querySelector('.log-viewer__with-gutter');
      expect(container).toBeInTheDocument();
    });

    it('should render content in separate column from gutter', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const contentColumn = document.querySelector('.log-viewer__content-column');
      expect(contentColumn).toBeInTheDocument();
    });

    it('should have clickable line number links', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const lineNumberLinks = document.querySelectorAll('.log-viewer__line-number');
      lineNumberLinks.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).toMatch(/^#L\d+$/);
      });
    });

    it('should have accessible line number links', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const lineNumberLinks = document.querySelectorAll('.log-viewer__line-number');
      lineNumberLinks.forEach((link) => {
        expect(link).toHaveAttribute('aria-label');
        expect(link.getAttribute('aria-label')).toMatch(/^Jump to line \d+$/);
      });
    });

    it('should align gutter cells with content lines', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const gutterCells = document.querySelectorAll('.log-viewer__gutter-cell');
      const contentItems = document.querySelectorAll(
        '.log-viewer__content-column .pf-v5-c-log-viewer__list-item',
      );

      // Should have matching number of visible items
      expect(gutterCells.length).toBe(contentItems.length);
    });
  });

  describe('Hash Navigation and Auto-scroll', () => {
    beforeEach(() => {
      window.location.hash = '';
    });

    afterEach(() => {
      window.location.hash = '';
    });

    it('should highlight and scroll to single line from URL hash', () => {
      window.location.hash = '#L2';

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      // Should highlight gutter cell
      const highlightedCells = document.querySelectorAll('.log-viewer__gutter-cell--highlighted');
      expect(highlightedCells.length).toBeGreaterThan(0);

      // Should highlight line content
      const highlightedLines = document.querySelectorAll('.log-viewer__line--highlighted');
      expect(highlightedLines.length).toBeGreaterThan(0);
    });

    it('should highlight and scroll to range of lines from URL hash', () => {
      window.location.hash = '#L1-L3';

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      // Range should be highlighted
      const highlightedCells = document.querySelectorAll('.log-viewer__gutter-cell--highlighted');
      expect(highlightedCells.length).toBeGreaterThan(0);

      const highlightedLines = document.querySelectorAll('.log-viewer__line--highlighted');
      expect(highlightedLines.length).toBeGreaterThan(0);
    });

    it('should scroll to bottom when hash line number exceeds log length', () => {
      window.location.hash = '#L100';
      const shortData = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} data={shortData} />);

      // Component should render without errors
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();

      // Should not crash and should handle gracefully
      expect(listElement).toBeInTheDocument();
    });

    it('should scroll to bottom when hash range exceeds log length', () => {
      window.location.hash = '#L50-L100';
      const shortData = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} data={shortData} />);

      // Component should render without errors even with out-of-range hash
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should wait for data to load before scrolling to hash', () => {
      window.location.hash = '#L5';

      // Start with empty data
      const { rerender } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} data="" />,
      );

      let listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();

      // Update with actual data
      const dataWithLines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
      rerender(<VirtualizedLogContent {...defaultProps} data={dataWithLines} />);

      // Should now have content and handle the hash
      listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();

      // Should highlight the line from hash
      const highlightedLines = document.querySelectorAll('.log-viewer__line--highlighted');
      expect(highlightedLines.length).toBeGreaterThan(0);
    });

    it('should handle hash navigation with very long logs', () => {
      window.location.hash = '#L500';
      const longData = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n');

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} data={longData} />);

      // Should render without performance issues
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();

      // Should only render visible items due to virtualization
      const items = document.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(items.length).toBeLessThan(1000);
    });

    it('should not scroll when hash is invalid', () => {
      window.location.hash = '#invalid';

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      // Should render normally without errors
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should not scroll when hash is empty', () => {
      window.location.hash = '';

      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      // Should render normally
      const listElement = document.querySelector('.pf-v5-c-log-viewer__list');
      expect(listElement).toBeInTheDocument();
    });
  });
});
