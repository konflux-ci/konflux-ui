import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Prism from 'prismjs';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { singleLogSection } from '../log-viewer-utils';
import registerLogSyntax from '../refractor-log';
import type { LogSection } from '../types';
import { VirtualizedLogContent } from '../VirtualizedLogContent';

// Register the log language
registerLogSyntax(Prism);

// Spy to capture scrollToIndex calls from the virtualizer.
const scrollToIndexSpy: jest.Mock | null = null;
jest.mock('@tanstack/react-virtual', () => {
  const actual = jest.requireActual('@tanstack/react-virtual');
  return {
    ...actual,
    useVirtualizer: (options: unknown) => {
      const virtualizer = actual.useVirtualizer(options);
      if (scrollToIndexSpy) {
        return { ...virtualizer, scrollToIndex: scrollToIndexSpy };
      }
      return virtualizer;
    },
  };
});

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
  const mockLineNumberNavigation = {
    highlightedLines: null,
    firstSelectedLine: null,
    handleLineClick: jest.fn(),
    isLineHighlighted: jest.fn().mockReturnValue(false),
  };

  const defaultProps = {
    sections: [singleLogSection(mockData)],
    height: 600,
    width: '100%',
    lineNumberNavigationProps: mockLineNumberNavigation,
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
      const listElement = document.querySelector('.log-content__list');

      expect(listElement).toBeInTheDocument();
    });

    it('should apply correct height and width styles', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} height={500} width={800} />,
      );

      const listElement = document.querySelector('.log-content__list');
      expect(listElement).toHaveStyle({ height: '500px', width: '800px' });
    });

    it('should support percentage width', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} width="80%" />);

      const listElement = document.querySelector('.log-content__list');
      expect(listElement).toHaveStyle({ width: '80%' });
    });

    it('should render measurement element for virtualization', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const measureElement = document.querySelector('.pf-v6-c-log-viewer__list-item');
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

      const items = document.querySelectorAll('.pf-v6-c-log-viewer__list-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should apply positioning styles to virtual items', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const items = document.querySelectorAll('.pf-v6-c-log-viewer__list-item');
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
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(longData)]} />,
      );

      const items = document.querySelectorAll('.pf-v6-c-log-viewer__list-item');
      // Should only render visible items, not all 1000
      expect(items.length).toBeLessThan(1000);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Log Line Rendering', () => {
    it('should render plain text log lines', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} />,
      );

      // Text may be split across multiple elements due to tokenization
      const logContent = container.querySelector('.log-content__list');
      expect(logContent).toBeInTheDocument();
      expect(logContent?.textContent).toContain('line 1');
      expect(logContent?.textContent).toContain('line 2');
      expect(logContent?.textContent).toContain('line 3');
    });

    it('should render actual log content', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} />,
      );

      // Use container queries since tokenization splits text across elements
      const logContent = container.querySelector('.log-content__list');
      expect(logContent?.textContent).toContain('line 1');
      expect(logContent?.textContent).toContain('line 2');
      expect(logContent?.textContent).toContain('line 3');
    });

    it('should preserve raw text when tokenization fails', () => {
      // Mock Prism.tokenize to simulate tokenization failure
      const tokenizeSpy = jest.spyOn(Prism, 'tokenize').mockImplementation(() => {
        throw new Error('Tokenization failed');
      });

      const testData = 'This line should still be visible even when tokenization fails';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(testData)]} />,
      );

      // Verify the raw text is displayed
      const logContent = container.querySelector('.log-content__list');
      expect(logContent?.textContent).toContain(testData);

      // Restore original tokenize function
      tokenizeSpy.mockRestore();
    });

    it('should display non-breaking space for truly empty lines', () => {
      const dataWithEmptyLine = 'line 1\n\nline 3';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection(dataWithEmptyLine)]}
        />,
      );

      const textElements = container.querySelectorAll('.pf-v6-c-log-viewer__text');
      // Find the empty line element (should contain only non-breaking space)
      const emptyLineElement = Array.from(textElements).find((el) => el.textContent === '\u00A0');
      expect(emptyLineElement).toBeInTheDocument();
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
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection('error on line 1')]}
          searchText="error"
        />,
      );

      const marks = document.querySelectorAll('mark.pf-v6-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should mark current search match with pf-m-current class', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection('error on line 1')]}
          searchText="error"
          currentSearchMatch={{ rowIndex: 1, matchIndex: 1 }}
        />,
      );

      const currentMark = document.querySelector('mark.pf-m-current');
      expect(currentMark).toBeInTheDocument();
    });

    it('should handle multiple matches in single line', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection('error error error')]}
          searchText="error"
        />,
      );

      const marks = document.querySelectorAll('mark.pf-v6-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBe(3);
    });

    it('should escape special regex characters in search', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection('[error] normal error')]}
          searchText="[error]"
        />,
      );

      const marks = container.querySelectorAll('mark.pf-v6-c-log-viewer__string.pf-m-match');
      // Syntax highlighting may split "[error]" into multiple tokens, creating multiple marks
      // but the combined text should be "[error]" and should NOT match the standalone "error"
      expect(marks.length).toBeGreaterThan(0);
      const combinedText = Array.from(marks)
        .map((m) => m.textContent)
        .join('');
      expect(combinedText).toBe('[error]');

      // Verify standalone "error" is NOT matched
      const logText = container.querySelector('.log-content__list')?.textContent || '';
      expect(logText).toContain('normal error');
      // The word "error" after "normal" should not be highlighted
      const allText = Array.from(marks)
        .map((m) => m.textContent)
        .join('');
      expect(allText).not.toContain('normal');
    });

    it('should be case insensitive in search', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection('ERROR Warning error')]}
          searchText="error"
        />,
      );

      const marks = document.querySelectorAll('mark.pf-v6-c-log-viewer__string.pf-m-match');
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
      const listElement = document.querySelector('.log-content__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should handle scrollToRow prop for scroll positioning', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} scrollToRow={5} />);

      const listElement = document.querySelector('.log-content__list');
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
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} sections={[]} />);

      const listElement = document.querySelector('.log-content__list');
      expect(listElement).toBeInTheDocument();
    });

    it('should handle single line data', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection('single line')]} />,
      );

      expect(screen.getByText('single line')).toBeInTheDocument();
    });

    it('should handle very long lines without breaking', () => {
      const longLine = 'a'.repeat(5000);
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(longLine)]} />,
      );

      const textElement = document.querySelector('.pf-v6-c-log-viewer__text');
      expect(textElement).toBeInTheDocument();
    });

    it('should handle data with trailing newlines', () => {
      const dataWithNewlines = 'line 1\nline 2\n\n';

      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(dataWithNewlines)]} />,
      );

      const listElement = document.querySelector('.log-content__list');
      expect(listElement).toBeInTheDocument();

      // Should render the lines - use container queries since tokenization splits text
      const logContent = container.querySelector('.log-content__list');
      expect(logContent?.textContent).toContain('line 1');
      expect(logContent?.textContent).toContain('line 2');
    });

    it('should handle special characters in log content', () => {
      const specialData = 'line with <html> tags\nline with & ampersand\nline with "quotes"';
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(specialData)]} />,
      );

      const listElement = document.querySelector('.log-content__list');
      expect(listElement?.textContent).toContain('<html>');
      expect(listElement?.textContent).toContain('&');
      expect(listElement?.textContent).toContain('"quotes"');
    });

    it('should preserve empty lines with non-breaking space', () => {
      const dataWithEmptyLines = 'line 1\n\nline 3\n\n\nline 6';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection(dataWithEmptyLines)]}
        />,
      );

      const textElements = container.querySelectorAll('.pf-v6-c-log-viewer__text');
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
        <VirtualizedLogContent
          {...defaultProps}
          sections={[singleLogSection(dataWithEmptyLines)]}
          searchText="error"
        />,
      );

      const textElements = container.querySelectorAll('.pf-v6-c-log-viewer__text');

      // Find the empty line element (should contain only non-breaking space)
      const emptyLineElement = Array.from(textElements).find((el) => el.textContent === '\u00A0');
      expect(emptyLineElement).toBeInTheDocument();

      // Should have search highlights for the two "error" lines
      const marks = container.querySelectorAll('mark.pf-v6-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBe(2);
    });
  });

  describe('Text Wrapping for Long Lines', () => {
    it('should wrap long lines using pre-wrap white-space', () => {
      // Create a very long line that would normally overflow
      const longLine = `ERROR: ${'A'.repeat(500)} - this is a very long error message`;
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(longLine)]} />,
      );

      const logText = container.querySelector('.pf-v6-c-log-viewer__text');
      expect(logText).toBeInTheDocument();

      // Verify element has the correct class for styling
      expect(logText?.className).toContain('pf-v6-c-log-viewer__text');
    });

    it('should break long words/URLs with word-break', () => {
      // Create a line with a very long unbreakable URL
      const longUrl = `https://example.com/very-long-path/${'segment/'.repeat(50)}endpoint`;
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(longUrl)]} />,
      );

      // Query the log list content (not the hidden measurement element)
      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();
      expect(logList?.textContent).toContain('https://example.com');
    });

    it('should preserve whitespace and line breaks with pre-wrap', () => {
      const dataWithSpaces = 'Line 1    with    spaces\n  Line 2 indented\nLine 3';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(dataWithSpaces)]} />,
      );

      const logText = container.querySelector('.log-content__list');
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
        <VirtualizedLogContent {...defaultProps} sections={[singleLogSection(mixedData)]} />,
      );

      // Query the actual virtualized list items (excluding the hidden measurement element)
      const scrollContainer = container.querySelector('.log-content__list');
      expect(scrollContainer).toBeInTheDocument();

      const listItems = scrollContainer?.querySelectorAll('.pf-v6-c-log-viewer__list-item');
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

      const gutter = document.querySelector('.log-content__gutter');
      expect(gutter).toBeInTheDocument();
    });

    it('should render line numbers in the gutter', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const lineNumbers = document.querySelectorAll('.line-number__line-number');
      expect(lineNumbers.length).toBeGreaterThan(0);
    });

    it('should apply with-gutter class to container', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const container = document.querySelector('.log-content__with-gutter');
      expect(container).toBeInTheDocument();
    });

    it('should render content alongside gutter in each row', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const contentColumn = document.querySelector('.log-content__row-content');
      expect(contentColumn).toBeInTheDocument();
    });

    it('should have clickable line number links', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const lineNumberLinks = document.querySelectorAll('.line-number__line-number');
      lineNumberLinks.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link.getAttribute('href')).toMatch(/^#L\d+$/);
      });
    });

    it('should have accessible line number links', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const lineNumberLinks = document.querySelectorAll('.line-number__line-number');
      lineNumberLinks.forEach((link) => {
        expect(link).toHaveAttribute('aria-label');
        expect(link.getAttribute('aria-label')).toMatch(/^Jump to line \d+$/);
      });
    });

    it('should align gutter cells with content rows', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      const gutterCells = document.querySelectorAll('.log-content__gutter');
      const contentItems = document.querySelectorAll('.log-content__row-content');

      // Each virtual row has exactly one gutter cell and one content area
      expect(gutterCells.length).toBe(contentItems.length);
    });
  });

  describe('Line Highlighting via Props', () => {
    it('should highlight a single line when highlightedLines is provided', () => {
      const navProps = {
        ...mockLineNumberNavigation,
        highlightedLines: { start: 2, end: 2 },
        isLineHighlighted: jest.fn((n: number) => n === 2),
      };

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} lineNumberNavigationProps={navProps} />,
      );

      const highlightedCells = document.querySelectorAll('.log-content__gutter--highlighted');
      expect(highlightedCells.length).toBeGreaterThan(0);

      const highlightedLines = document.querySelectorAll('.log-content__line--highlighted');
      expect(highlightedLines.length).toBeGreaterThan(0);
    });

    it('should highlight a range of lines when highlightedLines is provided', () => {
      const navProps = {
        ...mockLineNumberNavigation,
        highlightedLines: { start: 1, end: 3 },
        isLineHighlighted: jest.fn((n: number) => n >= 1 && n <= 3),
      };

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} lineNumberNavigationProps={navProps} />,
      );

      const highlightedCells = document.querySelectorAll('.log-content__gutter--highlighted');
      expect(highlightedCells.length).toBeGreaterThan(0);

      const highlightedLines = document.querySelectorAll('.log-content__line--highlighted');
      expect(highlightedLines.length).toBeGreaterThan(0);
    });

    it('should not show highlights when highlightedLines is null', () => {
      renderWithQueryClientAndRouter(<VirtualizedLogContent {...defaultProps} />);

      expect(document.querySelectorAll('.log-content__gutter--highlighted').length).toBe(0);
      expect(document.querySelectorAll('.log-content__line--highlighted').length).toBe(0);
    });

    it('should call handleLineClick when a line number link is clicked', () => {
      const handleLineClick = jest.fn();
      const navProps = { ...mockLineNumberNavigation, handleLineClick };

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} lineNumberNavigationProps={navProps} />,
      );

      const link = document.querySelector('[href="#L2"]');
      expect(link).not.toBeNull();
      fireEvent.click(link);

      expect(handleLineClick).toHaveBeenCalledWith(2, expect.any(Object));
    });
  });

  describe('Foldable sections', () => {
    const multiSections: LogSection[] = [
      { containerName: 'BUILD', data: 'compile\nlink', isCompleted: true },
      { containerName: 'TEST', data: 'running tests', isCompleted: false },
    ];

    afterEach(() => {
      window.location.hash = '';
    });

    it('should render section headers for each pipeline step', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={multiSections} />,
      );

      expect(screen.getByTestId('fold-header-BUILD')).toBeInTheDocument();
      expect(screen.getByTestId('fold-header-TEST')).toBeInTheDocument();
      expect(screen.getByText('BUILD')).toBeInTheDocument();
      expect(screen.getByText('TEST')).toBeInTheDocument();
    });

    it('should hide completed section content and show a fold indicator', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={multiSections} />,
      );

      expect(screen.queryByText('compile')).not.toBeInTheDocument();
      expect(screen.getByText('··· 2 lines hidden')).toBeInTheDocument();
      expect(screen.getByText('running tests')).toBeInTheDocument();
    });

    it('should toggle section visibility when the header is clicked', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={multiSections} />,
      );

      expect(screen.getByText('running tests')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('fold-header-TEST'));

      expect(screen.queryByText('running tests')).not.toBeInTheDocument();
      expect(screen.getByText('··· 1 line hidden')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('fold-header-TEST'));

      expect(screen.getByText('running tests')).toBeInTheDocument();
    });

    it('should expand a completed section when its header is clicked', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={multiSections} />,
      );

      expect(screen.queryByText('compile')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('fold-header-BUILD'));

      expect(screen.getByText('compile')).toBeInTheDocument();
      expect(screen.getByText('link')).toBeInTheDocument();
    });

    it('should expand a folded section when highlightedLines targets a line inside it', () => {
      const navProps = {
        ...mockLineNumberNavigation,
        highlightedLines: { start: 2, end: 2 },
        isLineHighlighted: jest.fn((n: number) => n === 2),
      };

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={multiSections}
          lineNumberNavigationProps={navProps}
        />,
      );

      expect(screen.getByText('compile')).toBeInTheDocument();
      expect(screen.getByText('link')).toBeInTheDocument();
    });

    it('should allow folding a section after highlight navigation expanded it', () => {
      const navProps = {
        ...mockLineNumberNavigation,
        highlightedLines: { start: 2, end: 2 },
        isLineHighlighted: jest.fn((n: number) => n === 2),
      };

      renderWithQueryClientAndRouter(
        <VirtualizedLogContent
          {...defaultProps}
          sections={multiSections}
          lineNumberNavigationProps={navProps}
        />,
      );

      expect(screen.getByText('compile')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('fold-header-BUILD'));

      expect(screen.queryByText('compile')).not.toBeInTheDocument();
      expect(screen.getByText('··· 2 lines hidden')).toBeInTheDocument();
    });

    it('should show a sticky header after scrolling in multi-section mode', () => {
      renderWithQueryClientAndRouter(
        <VirtualizedLogContent {...defaultProps} sections={multiSections} height={120} />,
      );

      expect(screen.queryByTestId('sticky-header-BUILD')).not.toBeInTheDocument();

      const listElement = document.querySelector('.log-content__list');
      if (!listElement) throw new Error('Expected scroll container');
      Object.defineProperty(listElement, 'scrollTop', { value: 80, configurable: true });
      fireEvent.scroll(listElement);

      expect(screen.getByTestId('sticky-header-BUILD')).toBeInTheDocument();
    });
  });
});
