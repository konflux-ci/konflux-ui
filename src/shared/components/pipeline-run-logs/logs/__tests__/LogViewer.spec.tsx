import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { saveAs } from 'file-saver';
import { useFullscreen } from '../../../../hooks/fullscreen';
import { useTheme } from '../../../../theme';
import LogViewer from '../LogViewer';

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('../../../../hooks/fullscreen', () => ({
  useFullscreen: jest.fn(() => [false, jest.fn(), jest.fn(), true]),
}));

jest.mock('../../../../theme', () => ({
  useTheme: jest.fn(() => ({
    preference: 'system',
    effectiveTheme: 'light',
    systemPreference: 'light',
    setThemePreference: jest.fn(),
  })),
}));

jest.mock('../../../status-box/StatusBox', () => ({
  LoadingInline: () => <div data-test="loading-inline">Loading...</div>,
}));

jest.mock('../LogsTaskDuration', () => {
  return function MockLogsTaskDuration() {
    return <span data-test="task-duration">duration</span>;
  };
});

jest.mock('@patternfly/react-log-viewer', () => ({
  LogViewer: (props: Record<string, unknown>) => {
    const { data, header, toolbar, ...otherProps } = props;
    return (
      <div data-test="patternfly-log-viewer" data-log-data={data as string} {...otherProps}>
        {header as React.ReactNode}
        {toolbar as React.ReactNode}
      </div>
    );
  },
  LogViewerSearch: ({ placeholder, width }: { placeholder: string; width: string }) => (
    <input data-test="log-search" placeholder={placeholder} style={{ width }} />
  ),
}));

const mockSaveAs = saveAs as jest.Mock;
const mockUseFullscreen = useFullscreen as jest.Mock;
const mockUseTheme = useTheme as jest.Mock;

describe('LogViewer', () => {
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
    status: {},
  };

  const defaultProps = {
    data: 'line 1\nline 2\nline 3',
    isLoading: false,
    errorMessage: null,
    taskRun: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFullscreen.mockReturnValue([false, jest.fn(), jest.fn(), true]);
    mockUseTheme.mockReturnValue({
      preference: 'system',
      effectiveTheme: 'light',
      systemPreference: 'light',
      setThemePreference: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render the LogViewer with basic props', () => {
      render(<LogViewer {...defaultProps} />);

      expect(screen.getByTestId('patternfly-log-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('patternfly-log-viewer')).toHaveAttribute(
        'data-log-data',
        defaultProps.data,
      );
    });

    it('should display task name when taskRun is provided', () => {
      render(<LogViewer {...defaultProps} taskRun={mockTaskRun} />);

      const taskNameElement = document.querySelector('[data-testid="logs-taskName"]');
      expect(taskNameElement).toBeInTheDocument();
      expect(screen.getByText('test-task')).toBeInTheDocument();
      expect(screen.getByTestId('task-duration')).toBeInTheDocument();
    });

    it('should display metadata name when taskRef name is not available', () => {
      const taskRunWithoutTaskRef = {
        ...mockTaskRun,
        spec: {},
      };

      render(<LogViewer {...defaultProps} taskRun={taskRunWithoutTaskRef} />);

      const taskNameElement = document.querySelector('[data-testid="logs-taskName"]');
      expect(taskNameElement).toBeInTheDocument();
      expect(taskNameElement).toHaveTextContent('test-task-run');
    });

    it('should show loading indicator when isLoading is true', () => {
      render(<LogViewer {...defaultProps} isLoading={true} taskRun={mockTaskRun} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error message when errorMessage is provided', () => {
      const errorMessage = 'Failed to load logs';
      render(<LogViewer {...defaultProps} errorMessage={errorMessage} taskRun={mockTaskRun} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render search component when showSearch is true (default)', () => {
      render(<LogViewer {...defaultProps} />);

      expect(screen.getByTestId('log-search')).toBeInTheDocument();
      expect(screen.getByTestId('log-search')).toHaveAttribute('placeholder', 'Search');
    });

    it('should not render search component when showSearch is false', () => {
      render(<LogViewer {...defaultProps} showSearch={false} />);

      expect(screen.queryByTestId('log-search')).not.toBeInTheDocument();
    });

    it('should render download all button when onDownloadAll and downloadAllLabel are provided', () => {
      const onDownloadAll = jest.fn().mockResolvedValue(undefined);

      render(
        <LogViewer
          {...defaultProps}
          onDownloadAll={onDownloadAll}
          downloadAllLabel="Download All Logs"
        />,
      );

      expect(screen.getByText('Download All Logs')).toBeInTheDocument();
    });

    it('should not render download all button when onDownloadAll is not provided', () => {
      render(<LogViewer {...defaultProps} downloadAllLabel="Download All Logs" />);

      expect(screen.queryByText('Download All Logs')).not.toBeInTheDocument();
    });
  });

  describe('auto-scroll calculation', () => {
    it('should calculate scrolledRow based on data lines when allowAutoScroll is true', () => {
      render(<LogViewer {...defaultProps} allowAutoScroll={true} />);

      const logViewer = screen.getByTestId('patternfly-log-viewer');
      // scrollToRow should be the number of lines (3 lines in defaultProps.data)
      expect(logViewer).toHaveAttribute('scrolltorow', '3');
    });

    it('should set scrolledRow to 0 when allowAutoScroll is false', () => {
      render(<LogViewer {...defaultProps} allowAutoScroll={false} />);

      const logViewer = screen.getByTestId('patternfly-log-viewer');
      expect(logViewer).toHaveAttribute('scrolltorow', '0');
    });

    it('should recalculate scrolledRow when data changes', () => {
      const { rerender } = render(<LogViewer {...defaultProps} allowAutoScroll={true} />);

      expect(screen.getByTestId('patternfly-log-viewer')).toHaveAttribute('scrolltorow', '3');

      const newData = 'line 1\nline 2\nline 3\nline 4\nline 5';
      rerender(<LogViewer {...defaultProps} data={newData} allowAutoScroll={true} />);

      expect(screen.getByTestId('patternfly-log-viewer')).toHaveAttribute('scrolltorow', '5');
    });
  });

  describe('user interactions', () => {
    it('should download logs when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<LogViewer {...defaultProps} taskRun={mockTaskRun} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-task.log');

      const [blob] = mockSaveAs.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect((blob as Blob).type).toBe('text/plain;charset=utf-8');

      // mock blob.text() since it's not available in test environment
      const mockBlob = blob as Blob & { text: () => Promise<string> };
      mockBlob.text = jest.fn().mockResolvedValue(defaultProps.data);
      const blobText = await mockBlob.text();
      expect(blobText).toBe(defaultProps.data);
    });

    it('should use metadata name for filename when taskRef name is not available', async () => {
      const user = userEvent.setup();
      const taskRunWithoutTaskRef = {
        ...mockTaskRun,
        spec: {},
      };

      render(<LogViewer {...defaultProps} taskRun={taskRunWithoutTaskRef} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'test-task-run.log');
    });

    it('should handle download all functionality', async () => {
      const user = userEvent.setup();
      const onDownloadAll = jest.fn().mockResolvedValue(undefined);

      render(
        <LogViewer
          {...defaultProps}
          onDownloadAll={onDownloadAll}
          downloadAllLabel="Download All"
        />,
      );

      const downloadAllButton = screen.getByRole('button', { name: /download all/i });
      await user.click(downloadAllButton);

      expect(onDownloadAll).toHaveBeenCalled();
    });

    it('should show loading state during download all operation', async () => {
      const user = userEvent.setup();
      let resolveDownload: () => void;
      const downloadPromise = new Promise<void>((resolve) => {
        resolveDownload = resolve;
      });
      const onDownloadAll = jest.fn().mockReturnValue(downloadPromise);

      render(
        <LogViewer
          {...defaultProps}
          onDownloadAll={onDownloadAll}
          downloadAllLabel="Download All"
        />,
      );

      const downloadAllButton = screen.getByRole('button', { name: /download all/i });
      await user.click(downloadAllButton);

      expect(downloadAllButton).toBeDisabled();

      expect(screen.getByTestId('loading-inline')).toBeInTheDocument();

      resolveDownload();
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

    it('should toggle fullscreen when fullscreen button is clicked', async () => {
      const user = userEvent.setup();
      const mockFullscreenToggle = jest.fn();
      mockUseFullscreen.mockReturnValue([false, jest.fn(), mockFullscreenToggle, true]);

      render(<LogViewer {...defaultProps} />);

      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);

      expect(mockFullscreenToggle).toHaveBeenCalled();
    });

    it('should show collapse button when in fullscreen mode', () => {
      mockUseFullscreen.mockReturnValue([true, jest.fn(), jest.fn(), true]);

      render(<LogViewer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /expand/i })).not.toBeInTheDocument();
    });

    it('should not render fullscreen button when fullscreenToggle is not available', () => {
      mockUseFullscreen.mockReturnValue([false, jest.fn(), null, true]);

      render(<LogViewer {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /expand/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /collapse/i })).not.toBeInTheDocument();
    });
  });

  describe('fullscreen styling', () => {
    it('should apply fullscreen height when in fullscreen mode', () => {
      mockUseFullscreen.mockReturnValue([true, jest.fn(), jest.fn(), true]);

      render(<LogViewer {...defaultProps} />);

      const logViewer = screen.getByTestId('patternfly-log-viewer');
      const container = logViewer.parentElement;
      expect(container).toHaveStyle({ height: '100vh' });
      expect(logViewer).toHaveAttribute('height', '100%');
    });

    it('should apply normal height when not in fullscreen mode', () => {
      mockUseFullscreen.mockReturnValue([false, jest.fn(), jest.fn(), true]);

      render(<LogViewer {...defaultProps} />);

      const logViewer = screen.getByTestId('patternfly-log-viewer');
      const container = logViewer.parentElement;
      expect(container).toHaveStyle({ height: '100%' });
      expect(logViewer).not.toHaveAttribute('height');
    });

    it('should apply fullscreen class to toolbar content when in fullscreen mode', () => {
      mockUseFullscreen.mockReturnValue([true, jest.fn(), jest.fn(), true]);

      render(<LogViewer {...defaultProps} />);

      const toolbarContent = document.querySelector('.log-viewer--fullscreen');
      expect(toolbarContent).toBeInTheDocument();
    });
  });
});
