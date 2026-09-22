import { screen } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';
import { PLRStatus } from '../plr-status-config';

// ---------------------------------------------------------------------------
// PLRStatus.StatusIconWithText
// ---------------------------------------------------------------------------

describe('PLRStatus.StatusIconWithText', () => {
  it('renders status text for a given runStatus', () => {
    renderWithQueryClientAndRouter(<PLRStatus.StatusIconWithText status={runStatus.Running} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders custom text when provided', () => {
    renderWithQueryClientAndRouter(
      <PLRStatus.StatusIconWithText status={runStatus.Failed} text="Build Failed" />,
    );
    expect(screen.getByText('Build Failed')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PLRStatus.useStatusDisplay
// ---------------------------------------------------------------------------

describe('PLRStatus.useStatusDisplay', () => {
  const TestHookConsumer = ({ plr }: { plr: PipelineRunKind | null }) => {
    const display = PLRStatus.useStatusDisplay(plr);
    return (
      <div>
        <span data-test="status">{display.status ?? 'null'}</span>
        <span data-test="label">{display.label}</span>
      </div>
    );
  };

  it('derives Running status from a running PLR', () => {
    renderWithQueryClientAndRouter(<TestHookConsumer plr={testPipelineRuns[DataState.RUNNING]} />);
    expect(screen.getByTestId('status')).toHaveTextContent('Running');
  });

  it('derives Succeeded status from a succeeded PLR', () => {
    renderWithQueryClientAndRouter(
      <TestHookConsumer plr={testPipelineRuns[DataState.SUCCEEDED]} />,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('Succeeded');
  });

  it('returns null status for null PLR', () => {
    renderWithQueryClientAndRouter(<TestHookConsumer plr={null} />);
    expect(screen.getByTestId('status')).toHaveTextContent('null');
  });
});

// ---------------------------------------------------------------------------
// PLRStatus.filterOptions
// ---------------------------------------------------------------------------

describe('PLRStatus.filterOptions', () => {
  it('has an option for every registered PLR status', () => {
    const registeredStatuses = PLRStatus.registry.allStatuses;
    expect(PLRStatus.filterOptions).toHaveLength(registeredStatuses.length);
    for (const s of registeredStatuses) {
      expect(PLRStatus.filterOptions.find((o) => o.value === s)).toBeDefined();
    }
  });

  it('each option has label and value', () => {
    for (const opt of PLRStatus.filterOptions) {
      expect(opt.label).toBeTruthy();
      expect(opt.value).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// PLRStatus.statusFilterFn
// ---------------------------------------------------------------------------

describe('PLRStatus.statusFilterFn', () => {
  it('returns true when PLR status matches selected values', () => {
    const runningPLR = testPipelineRuns[DataState.RUNNING];
    expect(PLRStatus.statusFilterFn(runningPLR, [runStatus.Running])).toBe(true);
  });

  it('returns false when PLR status does not match selected values', () => {
    const runningPLR = testPipelineRuns[DataState.RUNNING];
    expect(PLRStatus.statusFilterFn(runningPLR, [runStatus.Failed])).toBe(false);
  });

  it('handles Skipped correctly (no false positive for Succeeded)', () => {
    const skippedPLR = testPipelineRuns[DataState.SKIPPED];
    expect(PLRStatus.statusFilterFn(skippedPLR, [runStatus.Succeeded])).toBe(false);
    expect(PLRStatus.statusFilterFn(skippedPLR, [runStatus.Skipped])).toBe(true);
  });
});
