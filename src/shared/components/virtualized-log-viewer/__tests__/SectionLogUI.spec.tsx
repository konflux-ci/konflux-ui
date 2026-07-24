import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { logger } from '~/monitoring/logger';
import { SectionHeaderButton, FoldIndicatorLine, StickySectionHeaderBar } from '../SectionLogUI';
import type { SectionHeaderRow } from '../types';

jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn() },
}));

const makeRow = (overrides?: Partial<SectionHeaderRow>): SectionHeaderRow => ({
  kind: 'section-header',
  sectionName: 'BUILD',
  sectionIndex: 0,
  lineNumber: 1,
  lineCount: 500,
  isExpanded: true,
  isTailed: false,
  ...overrides,
});

describe('SectionHeaderButton', () => {
  it('should render section name and toggle button', () => {
    const onToggle = jest.fn();
    render(<SectionHeaderButton row={makeRow()} onToggle={onToggle} />);

    expect(screen.getByText('BUILD')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('fold-header-BUILD'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should set aria-expanded based on row.isExpanded', () => {
    render(<SectionHeaderButton row={makeRow({ isExpanded: false })} onToggle={jest.fn()} />);
    expect(screen.getByTestId('fold-header-BUILD')).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not show tailed indicator when isTailed is false', () => {
    render(<SectionHeaderButton row={makeRow({ isTailed: false })} onToggle={jest.fn()} />);

    expect(screen.queryByText(/showing last/)).not.toBeInTheDocument();
    expect(screen.queryByText('Download full logs')).not.toBeInTheDocument();
  });

  it('should show tailed indicator with line count when isTailed is true', () => {
    render(
      <SectionHeaderButton
        row={makeRow({ isTailed: true, lineCount: 500 })}
        onToggle={jest.fn()}
      />,
    );

    expect(screen.getByText('showing last 500 lines')).toBeInTheDocument();
  });

  it('should show download button when isTailed and onDownloadFullLogs provided', () => {
    const onDownload = jest.fn().mockResolvedValue(undefined);
    render(
      <SectionHeaderButton
        row={makeRow({ isTailed: true })}
        onToggle={jest.fn()}
        onDownloadFullLogs={onDownload}
      />,
    );

    expect(screen.getByText('Download full logs')).toBeInTheDocument();
    expect(screen.getByTestId('download-full-logs-BUILD')).toBeInTheDocument();
  });

  it('should not show download button when isTailed but no onDownloadFullLogs', () => {
    render(<SectionHeaderButton row={makeRow({ isTailed: true })} onToggle={jest.fn()} />);

    expect(screen.getByText(/showing last/)).toBeInTheDocument();
    expect(screen.queryByText('Download full logs')).not.toBeInTheDocument();
  });

  it('should call onDownloadFullLogs and show loading state on click', async () => {
    let resolveFn: () => void;
    const downloadPromise = new Promise<void>((resolve) => {
      resolveFn = resolve;
    });
    const onDownload = jest.fn().mockReturnValue(downloadPromise);

    render(
      <SectionHeaderButton
        row={makeRow({ isTailed: true })}
        onToggle={jest.fn()}
        onDownloadFullLogs={onDownload}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('download-full-logs-BUILD'));
    });

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('download-full-logs-BUILD')).toBeDisabled();

    await act(async () => {
      resolveFn();
      await downloadPromise;
    });

    expect(screen.getByTestId('download-full-logs-BUILD')).not.toBeDisabled();
  });

  it('should log warning and reset state on download failure', async () => {
    const onDownload = jest.fn().mockRejectedValue(new Error('network error'));

    render(
      <SectionHeaderButton
        row={makeRow({ isTailed: true })}
        onToggle={jest.fn()}
        onDownloadFullLogs={onDownload}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('download-full-logs-BUILD'));
    });

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.warn).toHaveBeenCalledWith('Failed to download full logs', {
        error: 'network error',
      });
      expect(screen.getByTestId('download-full-logs-BUILD')).not.toBeDisabled();
    });
  });

  it('should not trigger download when already downloading', () => {
    const onDownload = jest.fn().mockReturnValue(new Promise<void>(() => {}));

    render(
      <SectionHeaderButton
        row={makeRow({ isTailed: true })}
        onToggle={jest.fn()}
        onDownloadFullLogs={onDownload}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('download-full-logs-BUILD'));
    });

    act(() => {
      fireEvent.click(screen.getByTestId('download-full-logs-BUILD'));
    });

    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});

describe('FoldIndicatorLine', () => {
  it('should show plural form for multiple lines', () => {
    render(<FoldIndicatorLine lineCount={42} />);
    expect(screen.getByText('··· 42 lines hidden')).toBeInTheDocument();
  });

  it('should show singular form for one line', () => {
    render(<FoldIndicatorLine lineCount={1} />);
    expect(screen.getByText('··· 1 line hidden')).toBeInTheDocument();
  });
});

describe('StickySectionHeaderBar', () => {
  it('should render section header with line number and toggle', () => {
    const onToggle = jest.fn();
    const onLineClick = jest.fn();

    render(
      <StickySectionHeaderBar
        row={makeRow()}
        pushUpOffset={0}
        itemSize={20}
        onToggle={onToggle}
        onLineClick={onLineClick}
      />,
    );

    expect(screen.getByTestId('sticky-header-BUILD')).toBeInTheDocument();
    expect(screen.getByText('BUILD')).toBeInTheDocument();
    expect(screen.getByLabelText('Jump to line 1')).toBeInTheDocument();
  });

  it('should pass onDownloadFullLogs to SectionHeaderButton', () => {
    const onDownload = jest.fn().mockResolvedValue(undefined);

    render(
      <StickySectionHeaderBar
        row={makeRow({ isTailed: true })}
        pushUpOffset={0}
        itemSize={20}
        onToggle={jest.fn()}
        onLineClick={jest.fn()}
        onDownloadFullLogs={onDownload}
      />,
    );

    expect(screen.getByText('Download full logs')).toBeInTheDocument();
  });

  it('should apply transform and height styles', () => {
    render(
      <StickySectionHeaderBar
        row={makeRow()}
        pushUpOffset={-10}
        itemSize={24}
        onToggle={jest.fn()}
        onLineClick={jest.fn()}
      />,
    );

    const header = screen.getByTestId('sticky-header-BUILD');
    expect(header).toHaveStyle({ transform: 'translateY(-10px)', height: '24px' });
  });

  it('should call onLineClick when line number is clicked', () => {
    const onLineClick = jest.fn();

    render(
      <StickySectionHeaderBar
        row={makeRow()}
        pushUpOffset={0}
        itemSize={20}
        onToggle={jest.fn()}
        onLineClick={onLineClick}
      />,
    );

    fireEvent.click(screen.getByLabelText('Jump to line 1'));
    expect(onLineClick).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
