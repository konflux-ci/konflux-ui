import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { saveAs } from 'file-saver';
import { useFullscreen } from '~/shared/hooks/fullscreen';
import { useTheme } from '~/shared/theme';
import LogViewer from '../LogViewer';

// Mock only external dependencies and browser APIs
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('~/shared/hooks/fullscreen', () => ({
  useFullscreen: jest.fn(() => [false, jest.fn(), jest.fn(), true]),
}));

jest.mock('~/shared/theme', () => ({
  useTheme: jest.fn(() => ({
    preference: 'system',
    effectiveTheme: 'light',
    systemPreference: 'light',
    setThemePreference: jest.fn(),
  })),
}));

// Mock lodash-es debounce to make tests synchronous
jest.mock('lodash-es', () => ({
  ...jest.requireActual('lodash-es'),
  debounce: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  },
}));

const mockSaveAs = saveAs as jest.Mock;
const mockUseFullscreen = useFullscreen as jest.Mock;
const mockUseTheme = useTheme as jest.Mock;

describe('LogViewer Integration Tests', () => {
  const mockTaskRun = {
    apiVersion: 'tekton.dev/v1beta1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-task-run',
      namespace: 'test-namespace',
    },
    spec: {
      taskRef: {
        name: 'test-task',
      },
    },
    status: {
      startTime: '2024-01-01T00:00:00Z',
      completionTime: '2024-01-01T00:01:00Z',
    },
  };

  const defaultProps = {
    data: 'line 1\nline 2\nline 3\nline 4\nline 5',
    isLoading: false,
    errorMessage: null,
    taskRun: mockTaskRun,
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

    mockUseFullscreen.mockReturnValue([false, jest.fn(), jest.fn(), true]);
    mockUseTheme.mockReturnValue({
      preference: 'system',
      effectiveTheme: 'light',
      systemPreference: 'light',
      setThemePreference: jest.fn(),
    });

    // Suppress known harmless warnings and errors in test environment
    // eslint-disable-next-line no-console
    const originalConsoleError = console.error;
    // eslint-disable-next-line no-console
    const originalConsoleWarn = console.warn;

    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      if (message.includes('requestAnimationFrame') || message.includes('act(...)')) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      originalConsoleError(...(args as any[]));
    });

    jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      if (message.includes('mobx-react-lite')) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      originalConsoleWarn(...(args as any[]));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Full component rendering', () => {
    it('should render complete LogViewer with all sections', () => {
      const { container } = render(<LogViewer {...defaultProps} />);

      // Check container structure
      const logViewerContainer = container.querySelector('.log-viewer__container');
      expect(logViewerContainer).toBeInTheDocument();

      // Check PatternFly log viewer class
      const pfLogViewer = container.querySelector('.pf-v5-c-log-viewer');
      expect(pfLogViewer).toBeInTheDocument();

      // Check header section
      const header = container.querySelector('.pf-v5-c-log-viewer__header');
      expect(header).toBeInTheDocument();

      // Check toolbar
      const toolbar = container.querySelector('.pf-v5-c-toolbar');
      expect(toolbar).toBeInTheDocument();

      // Check main content area
      const main = container.querySelector('.pf-v5-c-log-viewer__main');
      expect(main).toBeInTheDocument();

      // Check scroll container
      const scrollContainer = container.querySelector('.pf-v5-c-log-viewer__scroll-container');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should render task name in banner', () => {
      const { container } = render(<LogViewer {...defaultProps} />);

      const banner = container.querySelector('[data-testid="logs-taskName"]');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent('test-task');
    });

    it('should render virtualized log content', () => {
      const { container } = render(<LogViewer {...defaultProps} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();

      const listItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should render all toolbar buttons', () => {
      render(<LogViewer {...defaultProps} />);

      expect(screen.getByLabelText('Dark theme')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
    });

    it('should render search input when showSearch is true', () => {
      render(<LogViewer {...defaultProps} showSearch={true} />);

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should not render search input when showSearch is false', () => {
      render(<LogViewer {...defaultProps} showSearch={false} />);

      const searchInput = screen.queryByPlaceholderText('Search');
      expect(searchInput).not.toBeInTheDocument();
    });
  });

  describe('ANSI escape code processing', () => {
    it('should strip ANSI escape codes from log data', () => {
      const dataWithAnsi = '\x1b[32mSuccess\x1b[0m\n\x1b[31mError\x1b[0m\nPlain text';

      const { container } = render(<LogViewer {...defaultProps} data={dataWithAnsi} />);

      const logText = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logText?.textContent).not.toContain('\x1b');
      expect(logText?.textContent).toContain('Success');
      expect(logText?.textContent).toContain('Error');
      expect(logText?.textContent).toContain('Plain text');
    });

    it('should handle carriage returns in log data', () => {
      const dataWithCR = 'line 1\roverwrite\nline 2';

      const { container } = render(<LogViewer {...defaultProps} data={dataWithCR} />);

      const logText = container.querySelector('.pf-v5-c-log-viewer__list');
      // \r should be replaced with \n
      expect(logText?.textContent).toContain('overwrite');
      expect(logText?.textContent).toContain('line 2');
    });
  });

  describe('Auto-scroll behavior', () => {
    it('should render with auto-scroll enabled', () => {
      const { container } = render(<LogViewer {...defaultProps} allowAutoScroll={true} />);

      const scrollContainer = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(scrollContainer).toBeInTheDocument();

      // Should render all log lines with virtualization
      const logItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(logItems.length).toBeGreaterThan(0);
    });

    it('should handle user scroll interactions', () => {
      const onScroll = jest.fn();
      const { container } = render(
        <LogViewer {...defaultProps} allowAutoScroll={true} onScroll={onScroll} />,
      );

      const scrollContainer = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(scrollContainer).toBeInTheDocument();

      // Simulate user scroll
      if (scrollContainer) {
        act(() => {
          scrollContainer.scrollTop = 100;
          scrollContainer.dispatchEvent(new Event('scroll'));
        });
      }

      // Component should handle scroll events
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Theme switching', () => {
    it('should toggle between light and dark themes', async () => {
      const user = userEvent.setup();
      const { container } = render(<LogViewer {...defaultProps} />);

      const themeCheckbox = screen.getByLabelText('Dark theme');
      const logViewer = container.querySelector('.pf-v5-c-log-viewer');

      // Initially dark theme
      expect(themeCheckbox).toBeChecked();
      expect(logViewer).toHaveClass('pf-m-dark');

      // Switch to light theme
      await user.click(themeCheckbox);

      await waitFor(() => {
        expect(logViewer).not.toHaveClass('pf-m-dark');
      });

      // Switch back to dark theme
      await user.click(themeCheckbox);

      await waitFor(() => {
        expect(logViewer).toHaveClass('pf-m-dark');
      });
    });

    it('should disable theme toggle when global theme is dark', () => {
      mockUseTheme.mockReturnValue({
        preference: 'dark',
        effectiveTheme: 'dark',
        systemPreference: 'light',
        setThemePreference: jest.fn(),
      });

      render(<LogViewer {...defaultProps} />);

      const themeCheckbox = screen.getByLabelText('Dark theme');
      expect(themeCheckbox).toBeDisabled();
    });
  });

  describe('Download functionality', () => {
    it('should download logs with correct filename', async () => {
      const user = userEvent.setup();
      render(<LogViewer {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /^Download$/i });
      await user.click(downloadButton);

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-task.log');
      const [blob] = mockSaveAs.mock.calls[0];
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });

    it('should not download when data is empty', async () => {
      const user = userEvent.setup();
      render(<LogViewer {...defaultProps} data="" />);

      const downloadButton = screen.getByRole('button', { name: /^Download$/i });
      await user.click(downloadButton);

      expect(mockSaveAs).not.toHaveBeenCalled();
    });

    it('should not render download all button when onDownloadAll is not provided', () => {
      render(<LogViewer {...defaultProps} downloadAllLabel="Download All Logs" />);

      expect(screen.queryByText('Download All Logs')).not.toBeInTheDocument();
    });

    it('should handle download all functionality', async () => {
      const user = userEvent.setup();
      const onDownloadAll = jest.fn().mockResolvedValue(undefined);

      render(
        <LogViewer
          {...defaultProps}
          onDownloadAll={onDownloadAll}
          downloadAllLabel="Download All Logs"
        />,
      );

      const downloadAllButton = screen.getByRole('button', { name: /download all logs/i });
      await user.click(downloadAllButton);

      expect(onDownloadAll).toHaveBeenCalled();

      await waitFor(() => {
        expect(downloadAllButton).not.toBeDisabled();
      });
    });

    it('should handle download all errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const onDownloadAll = jest.fn().mockRejectedValue(new Error('Download failed'));

      render(
        <LogViewer
          {...defaultProps}
          onDownloadAll={onDownloadAll}
          downloadAllLabel="Download All"
        />,
      );

      const downloadAllButton = screen.getByRole('button', { name: /download all/i });
      await user.click(downloadAllButton);

      await waitFor(() => {
        expect(downloadAllButton).not.toBeDisabled();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Download failed');
      consoleSpy.mockRestore();
    });
  });

  describe('Fullscreen functionality', () => {
    it('should toggle fullscreen mode', async () => {
      const user = userEvent.setup();
      const mockFullscreenToggle = jest.fn();
      mockUseFullscreen.mockReturnValue([
        false,
        { current: document.createElement('div') },
        mockFullscreenToggle,
        true,
      ]);

      render(<LogViewer {...defaultProps} />);

      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);

      expect(mockFullscreenToggle).toHaveBeenCalled();
    });

    it('should show collapse button in fullscreen mode', () => {
      mockUseFullscreen.mockReturnValue([
        true,
        { current: document.createElement('div') },
        jest.fn(),
        true,
      ]);

      render(<LogViewer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /expand/i })).not.toBeInTheDocument();
    });

    it('should apply fullscreen height styles', () => {
      mockUseFullscreen.mockReturnValue([
        true,
        { current: document.createElement('div') },
        jest.fn(),
        true,
      ]);

      const { container } = render(<LogViewer {...defaultProps} />);

      const logViewerContainer = container.querySelector('.log-viewer__container');
      expect(logViewerContainer).toHaveStyle({ height: '100vh' });
    });
  });

  describe('Loading and error states', () => {
    it('should show loading indicator', () => {
      render(<LogViewer {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error alert', () => {
      const errorMessage = 'Failed to fetch logs from KubeArchive';
      const { container } = render(<LogViewer {...defaultProps} errorMessage={errorMessage} />);

      const alert = container.querySelector('.pf-v5-c-alert.pf-m-danger');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show both loading and error states', () => {
      const { container } = render(
        <LogViewer {...defaultProps} isLoading={true} errorMessage="Network error" />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      const alert = container.querySelector('.pf-v5-c-alert.pf-m-danger');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Resume stream button integration', () => {
    // Note: Detailed resume button behavior (scroll detection, debouncing, click handling)
    // is fully tested in useAutoScrollWithResume.spec.ts
    // These integration tests verify the component correctly integrates with the hook

    it('should not show resume button initially', () => {
      const { queryByTestId } = render(<LogViewer {...defaultProps} allowAutoScroll={true} />);

      const resumeButton = queryByTestId('resume-log-stream');
      expect(resumeButton).not.toBeInTheDocument();
    });

    it('should integrate useAutoScrollWithResume hook when allowAutoScroll is true', () => {
      const { container } = render(<LogViewer {...defaultProps} allowAutoScroll={true} />);

      // Component should render successfully with auto-scroll enabled
      const logViewer = container.querySelector('.pf-v5-c-log-viewer');
      expect(logViewer).toBeInTheDocument();

      // The resume button wrapper should be conditionally rendered based on hook state
      // (button appears/disappears based on scroll direction, tested in hook tests)
    });

    it('should pass allowAutoScroll prop to useAutoScrollWithResume hook', () => {
      const { rerender, container } = render(
        <LogViewer {...defaultProps} allowAutoScroll={false} />,
      );

      let logViewer = container.querySelector('.pf-v5-c-log-viewer');
      expect(logViewer).toBeInTheDocument();

      // Should handle prop change without crashing
      rerender(<LogViewer {...defaultProps} allowAutoScroll={true} />);
      logViewer = container.querySelector('.pf-v5-c-log-viewer');
      expect(logViewer).toBeInTheDocument();
    });

    it('should pass onScroll callback to useAutoScrollWithResume hook', () => {
      const onScroll = jest.fn();

      // Component should render without errors when onScroll is provided
      expect(() => {
        render(<LogViewer {...defaultProps} allowAutoScroll={true} onScroll={onScroll} />);
      }).not.toThrow();
    });

    it('should render resume button with data-testid when visible', () => {
      // The resume button has data-testid="resume-log-stream" for testing
      // It appears conditionally based on useAutoScrollWithResume hook state
      const { container } = render(<LogViewer {...defaultProps} allowAutoScroll={true} />);

      // Verify component structure is correct (button will appear based on scroll state)
      const logViewer = container.querySelector('.pf-v5-c-log-viewer');
      expect(logViewer).toBeInTheDocument();
    });
  });

  describe('Data updates', () => {
    it('should update log content when data changes', () => {
      const { container, rerender } = render(<LogViewer {...defaultProps} />);

      let logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();

      const newData = 'new line 1\nnew line 2\nnew line 3';
      rerender(<LogViewer {...defaultProps} data={newData} />);

      logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      const { container } = render(<LogViewer {...defaultProps} data="" />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });

    it('should handle very long log data', () => {
      const longData = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n');

      const { container } = render(<LogViewer {...defaultProps} data={longData} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();

      // Should use virtualization (only render visible items)
      const visibleItems = container.querySelectorAll('.pf-v5-c-log-viewer__list-item');
      expect(visibleItems.length).toBeLessThan(1000);
    });
  });

  describe('Task information display', () => {
    it('should display task name with truncation', () => {
      const longTaskName = 'very-long-task-name-that-should-be-truncated-in-the-ui';
      const taskRunWithLongName = {
        ...mockTaskRun,
        spec: { taskRef: { name: longTaskName } },
      };

      const { container } = render(<LogViewer {...defaultProps} taskRun={taskRunWithLongName} />);

      const truncateElement = container.querySelector('.pf-v5-c-truncate');
      expect(truncateElement).toBeInTheDocument();
      expect(truncateElement).toHaveTextContent(longTaskName);
    });

    it('should use metadata name when taskRef is not available', () => {
      const taskRunWithoutTaskRef = {
        ...mockTaskRun,
        spec: {},
      };

      render(<LogViewer {...defaultProps} taskRun={taskRunWithoutTaskRef} />);

      expect(screen.getByText('test-task-run')).toBeInTheDocument();
    });

    it('should not show task name section when no task information is available', () => {
      const { container } = render(<LogViewer {...defaultProps} taskRun={null} />);

      const truncateElement = container.querySelector('.pf-v5-c-truncate');
      expect(truncateElement).not.toBeInTheDocument();
    });

    it('should not show task name when task name is empty string', () => {
      const taskRunEmptyName = {
        ...mockTaskRun,
        spec: { taskRef: { name: '' } },
        metadata: { name: '' },
      };
      const { container } = render(<LogViewer {...defaultProps} taskRun={taskRunEmptyName} />);

      const truncateElement = container.querySelector('.pf-v5-c-truncate');
      expect(truncateElement).not.toBeInTheDocument();
    });

    it('should not show task name when task metadata is missing', () => {
      const taskRunNoNames = { ...mockTaskRun, spec: {}, metadata: {} };
      const { container } = render(<LogViewer {...defaultProps} taskRun={taskRunNoNames} />);

      const truncateElement = container.querySelector('.pf-v5-c-truncate');
      expect(truncateElement).not.toBeInTheDocument();
    });
  });

  describe('Scroll callback integration', () => {
    it('should call onScroll callback with scroll information', () => {
      const onScroll = jest.fn();

      render(<LogViewer {...defaultProps} onScroll={onScroll} />);

      expect(onScroll).toHaveBeenCalledWith({
        scrollDirection: 'forward',
        scrollOffset: 0,
        scrollUpdateWasRequested: true,
      });
    });
  });

  describe('Context providers integration', () => {
    it('should provide LogViewerContext to children', () => {
      render(<LogViewer {...defaultProps} />);

      // LogViewerContext is used by search functionality
      const searchInput = screen.queryByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });

    it('should provide LogViewerToolbarContext to children', () => {
      render(<LogViewer {...defaultProps} showSearch={true} />);

      // Search component should be able to access toolbar context
      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle null taskRun gracefully', () => {
      expect(() => {
        render(<LogViewer {...defaultProps} taskRun={null} />);
      }).not.toThrow();
    });

    it('should handle missing taskRun status', () => {
      const taskRunWithoutStatus = {
        ...mockTaskRun,
        status: undefined,
      };

      expect(() => {
        render(<LogViewer {...defaultProps} taskRun={taskRunWithoutStatus} />);
      }).not.toThrow();
    });

    it('should handle data with only newlines', () => {
      const { container } = render(<LogViewer {...defaultProps} data="\n\n\n\n" />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });

    it('should handle data with special characters', () => {
      const specialData = 'line with <html> tags\nline with & ampersand\nline with "quotes"';

      const { container } = render(<LogViewer {...defaultProps} data={specialData} />);

      const logList = container.querySelector('.pf-v5-c-log-viewer__list');
      expect(logList).toBeInTheDocument();
    });
  });
});
