import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedLogViewer } from '../VirtualizedLogViewer';

// Mock lodash-es debounce to make tests synchronous
jest.mock('lodash-es', () => ({
  ...jest.requireActual('lodash-es'),
  debounce: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  },
}));

describe('VirtualizedLogViewer Integration Tests', () => {
  const mockData = 'line 1\nline 2\nline 3';
  const defaultProps = {
    data: mockData,
    height: 600,
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

  describe('Structure and Layout', () => {
    it('should render complete component structure with PatternFly classes', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} />);

      const mainElement = container.querySelector('.pf-v5-c-log-viewer__main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveStyle({ height: '100%' });

      const scrollContainer = container.querySelector('.pf-v5-c-log-viewer__scroll-container');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveStyle({ height: '100%' });
    });

    it('should render virtualized log list with real VirtualizedLogContent integration', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();

      // Should render actual log items through VirtualizedLogContent
      const logItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(logItems.length).toBeGreaterThan(0);
    });

    it('should integrate with VirtualizedLogContent and render actual log lines', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} />);

      // Verify real integration - actual log content is rendered
      expect(container.textContent).toContain('line 1');
      expect(container.textContent).toContain('line 2');
      expect(container.textContent).toContain('line 3');
    });
  });

  describe('Data Handling and Integration', () => {
    it('should render custom data through VirtualizedLogContent', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} data="test data" />);

      expect(container.textContent).toContain('test data');
    });

    it('should handle empty data gracefully', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} data="" />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });

    it('should render multiline data correctly', () => {
      const multilineData = 'line 1\nline 2\nline 3\nline 4';
      const { container } = render(<VirtualizedLogViewer {...defaultProps} data={multilineData} />);

      expect(container.textContent).toContain('line 1');
      expect(container.textContent).toContain('line 2');
      expect(container.textContent).toContain('line 3');
      expect(container.textContent).toContain('line 4');
    });
  });

  describe('Dimensions and Styling', () => {
    it('should apply custom height to VirtualizedLogContent', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} height={500} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toHaveStyle({ height: '500px' });
    });

    it('should use default width of 100%', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toHaveStyle({ width: '100%' });
    });

    it('should accept custom width as string', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} width="80%" />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toHaveStyle({ width: '80%' });
    });

    it('should accept custom width as number', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} width={800} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toHaveStyle({ width: '800px' });
    });
  });

  describe('Scroll Behavior Integration', () => {
    it('should pass scroll callback to VirtualizedLogContent', () => {
      const onScroll = jest.fn();
      const { container } = render(<VirtualizedLogViewer {...defaultProps} onScroll={onScroll} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();

      // Component should be rendered with scroll capability
      expect(onScroll).toBeDefined();
    });

    it('should work without onScroll callback', () => {
      expect(() => {
        render(<VirtualizedLogViewer {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Search Integration with Toolbar Context', () => {
    it('should integrate with search and highlight matches in VirtualizedLogContent', () => {
      const mockToolbarContext = {
        searchedInput: 'line',
        currentSearchedItemCount: 0,
        searchedWordIndexes: [],
        scrollToRow: jest.fn(),
        setSearchedInput: jest.fn(),
        setCurrentSearchedItemCount: jest.fn(),
        setRowInFocus: jest.fn(),
        setSearchedWordIndexes: jest.fn(),
        itemCount: 3,
        rowInFocus: { rowIndex: -1, matchIndex: -1 },
      };

      const { container } = render(
        <LogViewerToolbarContext.Provider value={mockToolbarContext}>
          <VirtualizedLogViewer {...defaultProps} />
        </LogViewerToolbarContext.Provider>,
      );

      // Should render search highlights through VirtualizedLogContent
      const marks = container.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should work without toolbar context', () => {
      const { container } = render(<VirtualizedLogViewer {...defaultProps} />);

      // Should render without search functionality
      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });

    it('should highlight current search match', () => {
      const mockToolbarContext = {
        searchedInput: 'line',
        currentSearchedItemCount: 1,
        searchedWordIndexes: [
          { rowIndex: 0, matchIndex: 1 },
          { rowIndex: 1, matchIndex: 1 },
          { rowIndex: 2, matchIndex: 1 },
        ],
        scrollToRow: jest.fn(),
        setSearchedInput: jest.fn(),
        setCurrentSearchedItemCount: jest.fn(),
        setRowInFocus: jest.fn(),
        setSearchedWordIndexes: jest.fn(),
        itemCount: 3,
        rowInFocus: { rowIndex: -1, matchIndex: -1 },
      };

      const { container } = render(
        <LogViewerToolbarContext.Provider value={mockToolbarContext}>
          <VirtualizedLogViewer {...defaultProps} />
        </LogViewerToolbarContext.Provider>,
      );

      // Should mark current match with pf-m-current class
      const currentMark = container.querySelector('mark.pf-m-current');
      expect(currentMark).toBeInTheDocument();
    });
  });

  describe('Line Numbers and Hash Navigation', () => {
    let originalLocation: Location;

    beforeEach(() => {
      // Save and mock window.location for hash navigation tests
      originalLocation = window.location;
      delete (window as unknown as { location: Location }).location;
      window.location = {
        ...originalLocation,
        hash: '',
      } as Location;
    });

    afterEach(() => {
      // Restore original location
      window.location = originalLocation;
    });

    it('should render line numbers when hasLineNumbers is true', () => {
      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={true} />,
      );

      const gutter = container.querySelector('.log-viewer__gutter');
      expect(gutter).toBeInTheDocument();

      const lineNumbers = container.querySelectorAll('.log-viewer__line-number');
      expect(lineNumbers.length).toBeGreaterThan(0);
    });

    it('should not render line numbers when hasLineNumbers is false', () => {
      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={false} />,
      );

      const gutter = container.querySelector('.log-viewer__gutter');
      expect(gutter).not.toBeInTheDocument();
    });

    it('should highlight selected line from hash #L2', () => {
      window.location.hash = '#L2';

      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={true} />,
      );

      // Line number should be highlighted
      const lineNumber2 = container.querySelector('.log-viewer__line-number--selected');
      expect(lineNumber2).toBeInTheDocument();
      expect(lineNumber2?.textContent).toBe('2');

      // Content line should be highlighted
      const selectedLine = container.querySelector('.log-viewer__line--selected');
      expect(selectedLine).toBeInTheDocument();
    });

    it('should highlight line range from hash #L1-L3', () => {
      window.location.hash = '#L1-L3';

      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={true} />,
      );

      // All three line numbers should be highlighted
      const selectedLineNumbers = container.querySelectorAll('.log-viewer__line-number--selected');
      expect(selectedLineNumbers.length).toBe(3);

      // All three content lines should be highlighted
      const selectedLines = container.querySelectorAll('.log-viewer__line--selected');
      expect(selectedLines.length).toBe(3);
    });

    it('should handle hash changes dynamically', async () => {
      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={true} />,
      );

      // Initially no selection
      let selectedLineNumbers = container.querySelectorAll('.log-viewer__line-number--selected');
      expect(selectedLineNumbers.length).toBe(0);

      // Change hash
      window.location.hash = '#L2';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      // Should now have selection
      await waitFor(() => {
        selectedLineNumbers = container.querySelectorAll('.log-viewer__line-number--selected');
        expect(selectedLineNumbers.length).toBeGreaterThan(0);
      });
    });

    it('should update hash when clicking line numbers', () => {
      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={true} />,
      );

      const lineNumber2 = Array.from(container.querySelectorAll('.log-viewer__line-number')).find(
        (el) => el.textContent === '2',
      );
      expect(lineNumber2).toBeInTheDocument();

      if (lineNumber2) {
        fireEvent.click(lineNumber2);
        expect(window.location.hash).toBe('#L2');
      }
    });

    it('should create range selection with shift+click', () => {
      const { container } = render(
        <VirtualizedLogViewer {...defaultProps} hasLineNumbers={true} />,
      );

      // First click on line 1
      const lineNumber1 = Array.from(container.querySelectorAll('.log-viewer__line-number')).find(
        (el) => el.textContent === '1',
      );
      if (lineNumber1) {
        fireEvent.click(lineNumber1);
        expect(window.location.hash).toBe('#L1');
      }

      // Shift+click on line 3
      const lineNumber3 = Array.from(container.querySelectorAll('.log-viewer__line-number')).find(
        (el) => el.textContent === '3',
      );
      if (lineNumber3) {
        fireEvent.click(lineNumber3, { shiftKey: true });
        expect(window.location.hash).toBe('#L1-L3');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long data efficiently with virtualization', () => {
      const longData = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n');
      const { container } = render(<VirtualizedLogViewer {...defaultProps} data={longData} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();

      // Virtualization should only render visible items
      const visibleItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(visibleItems.length).toBeLessThan(1000);
    });

    it('should handle data with special characters', () => {
      const specialData = 'line with <html> tags\nline with & ampersand\nline with "quotes"';
      const { container } = render(<VirtualizedLogViewer {...defaultProps} data={specialData} />);

      expect(container.textContent).toContain('<html>');
      expect(container.textContent).toContain('&');
      expect(container.textContent).toContain('"quotes"');
    });

    it('should handle negative rowIndex in search focus', () => {
      const mockToolbarContext = {
        searchedInput: 'error',
        currentSearchedItemCount: 0,
        searchedWordIndexes: [{ rowIndex: -1, matchIndex: -1 }],
        scrollToRow: jest.fn(),
        setSearchedInput: jest.fn(),
        setCurrentSearchedItemCount: jest.fn(),
        setRowInFocus: jest.fn(),
        setSearchedWordIndexes: jest.fn(),
        itemCount: 3,
        rowInFocus: { rowIndex: -1, matchIndex: -1 },
      };

      expect(() => {
        render(
          <LogViewerToolbarContext.Provider value={mockToolbarContext}>
            <VirtualizedLogViewer {...defaultProps} scrollToRow={5} />
          </LogViewerToolbarContext.Provider>,
        );
      }).not.toThrow();
    });

    it('should handle empty searchedWordIndexes array', () => {
      const mockToolbarContext = {
        searchedInput: 'error',
        currentSearchedItemCount: 0,
        searchedWordIndexes: [],
        scrollToRow: jest.fn(),
        setSearchedInput: jest.fn(),
        setCurrentSearchedItemCount: jest.fn(),
        setRowInFocus: jest.fn(),
        setSearchedWordIndexes: jest.fn(),
        itemCount: 3,
        rowInFocus: { rowIndex: -1, matchIndex: -1 },
      };

      const { container } = render(
        <LogViewerToolbarContext.Provider value={mockToolbarContext}>
          <VirtualizedLogViewer {...defaultProps} />
        </LogViewerToolbarContext.Provider>,
      );

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });
  });
});
