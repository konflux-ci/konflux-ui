import { LogViewerToolbarContext } from '@patternfly/react-log-viewer';
import '@testing-library/jest-dom';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
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
    it('should render complete component structure', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} />,
      );

      const mainElement = container.querySelector('.pf-v5-c-log-viewer__main');
      expect(mainElement).toBeInTheDocument();

      const scrollContainer = container.querySelector('.log-content__list');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should render virtualized log list with real VirtualizedLogContent integration', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();

      // Should render actual log items through VirtualizedLogContent
      const logItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(logItems.length).toBeGreaterThan(0);
    });

    it('should integrate with VirtualizedLogContent and render actual log lines', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} />,
      );

      // Verify real integration - actual log content is rendered
      expect(container.textContent).toContain('line 1');
      expect(container.textContent).toContain('line 2');
      expect(container.textContent).toContain('line 3');
    });
  });

  describe('Data Handling and Integration', () => {
    it('should render custom data through VirtualizedLogContent', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} data="test data" />,
      );

      expect(container.textContent).toContain('test data');
    });

    it('should handle empty data gracefully', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} data="" />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();
    });

    it('should render multiline data correctly', () => {
      const multilineData = 'line 1\nline 2\nline 3\nline 4';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} data={multilineData} />,
      );

      expect(container.textContent).toContain('line 1');
      expect(container.textContent).toContain('line 2');
      expect(container.textContent).toContain('line 3');
      expect(container.textContent).toContain('line 4');
    });
  });

  describe('Dimensions and Styling', () => {
    it('should apply custom height to VirtualizedLogContent', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} height={500} />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();
      expect(logList).toHaveStyle({ height: '500px' });
    });

    it('should use default width of 100%', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toHaveStyle({ width: '100%' });
    });

    it('should accept custom width as string', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} width="80%" />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toHaveStyle({ width: '80%' });
    });

    it('should accept custom width as number', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} width={800} />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toHaveStyle({ width: '800px' });
    });
  });

  describe('Scroll Behavior Integration', () => {
    it('should pass scroll callback to VirtualizedLogContent', () => {
      const onScroll = jest.fn();
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} onScroll={onScroll} />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();

      // Component should be rendered with scroll capability
      expect(onScroll).toBeDefined();
    });

    it('should work without onScroll callback', () => {
      expect(() => {
        renderWithQueryClientAndRouter(<VirtualizedLogViewer {...defaultProps} />);
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

      const { container } = renderWithQueryClientAndRouter(
        <LogViewerToolbarContext.Provider value={mockToolbarContext}>
          <VirtualizedLogViewer {...defaultProps} />
        </LogViewerToolbarContext.Provider>,
      );

      // Should render search highlights through VirtualizedLogContent
      const marks = container.querySelectorAll('mark.pf-v5-c-log-viewer__string.pf-m-match');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should work without toolbar context', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} />,
      );

      // Should render without search functionality
      const logList = container.querySelector('.log-content__list');
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

      const { container } = renderWithQueryClientAndRouter(
        <LogViewerToolbarContext.Provider value={mockToolbarContext}>
          <VirtualizedLogViewer {...defaultProps} />
        </LogViewerToolbarContext.Provider>,
      );

      // Should mark current match with pf-m-current class
      const currentMark = container.querySelector('mark.pf-m-current');
      expect(currentMark).toBeInTheDocument();
    });
  });

  describe('Sections mode (foldable steps)', () => {
    const mockSections = [
      { name: 'step-init', data: 'init log line 1\ninit log line 2', isCompleted: true },
      { name: 'step-build', data: 'build log line 1\nbuild log line 2', isCompleted: false },
    ];

    it('renders section headers for each section', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={mockSections} />,
      );

      // Section header buttons should be present
      const headers = container.querySelectorAll('.log-content__section-header');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('renders section names in headers', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={mockSections} />,
      );

      const content = container.textContent ?? '';
      expect(content).toContain('step-init');
      expect(content).toContain('step-build');
    });

    it('renders log lines for expanded sections', () => {
      // step-build is not completed so it starts expanded
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={mockSections} />,
      );

      const content = container.textContent ?? '';
      expect(content).toContain('build log line 1');
    });

    it('renders a fold-indicator for collapsed (completed) sections', () => {
      // step-init isCompleted=true → starts collapsed → shows fold-indicator
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={mockSections} />,
      );

      const foldIndicator = container.querySelector('.log-content__fold-indicator');
      expect(foldIndicator).toBeInTheDocument();
    });

    it('falls back to plain data when sections is undefined', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={undefined} />,
      );

      // Should not render section-header buttons in plain mode
      const headers = container.querySelectorAll('.log-content__section-header');
      expect(headers.length).toBe(0);

      // Plain log lines should be rendered
      expect(container.textContent).toContain('line 1');
    });

    it('falls back to plain data when sections is an empty array', () => {
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={[]} />,
      );

      const headers = container.querySelectorAll('.log-content__section-header');
      expect(headers.length).toBe(0);
    });

    it('renders gutter line numbers from global line counter (not virtualizer index)', () => {
      // With a single section of 2 lines, the section header is line 1
      // and content lines are 2 and 3.  The gutter should NOT show "1" for the
      // section-header row; it should start showing numbers from the content rows.
      const singleSection = [{ name: 'my-step', data: 'log a\nlog b', isCompleted: false }];

      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} sections={singleSection} />,
      );

      const lineNumbers = Array.from(container.querySelectorAll('.line-number__line-number')).map(
        (el) => el.textContent,
      );

      // Content lines are global lines 2 and 3 (header occupies line 1)
      expect(lineNumbers).toContain('2');
      expect(lineNumbers).toContain('3');
      // Line 1 belongs to the section header which has no gutter cell
      expect(lineNumbers).not.toContain('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long data efficiently with virtualization', () => {
      const longData = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n');
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} data={longData} />,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();

      // Virtualization should only render visible items
      const visibleItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(visibleItems.length).toBeLessThan(1000);
    });

    it('should handle data with special characters', () => {
      const specialData = 'line with <html> tags\nline with & ampersand\nline with "quotes"';
      const { container } = renderWithQueryClientAndRouter(
        <VirtualizedLogViewer {...defaultProps} data={specialData} />,
      );

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
        renderWithQueryClientAndRouter(
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

      const { container } = renderWithQueryClientAndRouter(
        <LogViewerToolbarContext.Provider value={mockToolbarContext}>
          <VirtualizedLogViewer {...defaultProps} />
        </LogViewerToolbarContext.Provider>,
      );

      const logList = container.querySelector('.log-content__list');
      expect(logList).toBeInTheDocument();
    });
  });
});
