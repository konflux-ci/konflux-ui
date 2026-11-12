import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useKueueQueuePositionForPipelineRun } from '~/kueue/kueue-hooks';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import type { PipelineRunKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { DataState, testPipelineRuns } from '../../../__data__/pipelinerun-data';
import PipelineRunStatus from '../PipelineRunStatus';

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/kueue/kueue-hooks', () => ({
  useKueueQueuePositionForPipelineRun: jest.fn(),
}));

jest.mock('~/shared/hooks/useCurrentTime', () => ({
  useCurrentTime: jest.fn(),
}));

const mockUseTaskRuns = jest.mocked(useTaskRunsForPipelineRuns);
const mockUseIsOnFeatureFlag = jest.mocked(useIsOnFeatureFlag);
const mockUseKueuePosition = jest.mocked(useKueueQueuePositionForPipelineRun);
const mockUseCurrentTime = jest.mocked(useCurrentTime);

// 6 hours 12 minutes after the fixture's creationTimestamp ('2022-11-28T12:08:22Z').
const NOW = Date.parse('2022-11-28T12:08:22Z') + (6 * 60 + 12) * 60 * 1000;

const queuePosition = (positionInClusterQueue: number) => ({
  positionInClusterQueue,
  positionInLocalQueue: positionInClusterQueue,
  localQueueName: 'default-queue',
  priority: 600,
});

mockUseNamespaceHook('test-ns');

describe('PipelineRunStatus', () => {
  beforeEach(() => {
    mockUseTaskRuns.mockReturnValue([[], true, undefined, jest.fn(), {} as never]);
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseKueuePosition.mockReturnValue({
      queuePosition: undefined,
      isLoading: false,
      error: undefined,
      hasPayload: false,
    });
    mockUseCurrentTime.mockReturnValue(NOW);
  });

  it('renders status for a running PLR', () => {
    const plr = testPipelineRuns[DataState.RUNNING];
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders status for a succeeded PLR', () => {
    const plr = testPipelineRuns[DataState.SUCCEEDED];
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
  });

  it('does not fetch TaskRuns for non-failed PLRs', () => {
    const plr = testPipelineRuns[DataState.RUNNING];
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
    expect(mockUseTaskRuns).toHaveBeenCalledWith(null, null, undefined, false);
  });

  it('does not eagerly fetch TaskRuns for failed PLRs when tooltip is hidden', () => {
    const plr = testPipelineRuns[DataState.FAILED];
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} isTooltipVisible={false} />);
    expect(mockUseTaskRuns).toHaveBeenCalledWith(null, null, undefined, false);
  });

  it('fetches TaskRuns for failed PLRs when tooltip is visible', () => {
    const plr = testPipelineRuns[DataState.FAILED];
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
    expect(mockUseTaskRuns).toHaveBeenCalledWith('test-ns', plr.metadata?.name, undefined, false);
  });

  it('shows succeededCond.message as tooltip for failed PLR when TaskRuns not loaded', async () => {
    mockUseTaskRuns.mockReturnValue([[], false, undefined, jest.fn(), {} as never]);
    const plr = testPipelineRuns[DataState.FAILED];
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);

    await user.hover(screen.getByText('Failed'));
    expect(
      await screen.findByText('Error retrieving pipeline for pipelinerun'),
    ).toBeInTheDocument();
  });

  it('shows log snippet title and message as tooltip for failed PLR when TaskRuns loaded', async () => {
    const plr = testPipelineRuns[DataState.FAILED];
    mockUseTaskRuns.mockReturnValue([[], true, undefined, jest.fn(), {} as never]);
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);

    await user.hover(screen.getByText('Failed'));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Failure - check logs for details.');
    expect(tooltip).toHaveTextContent('Error retrieving pipeline for pipelinerun');
  });

  it('does not render tooltip when isTooltipVisible is false', () => {
    const plr = testPipelineRuns[DataState.FAILED];
    const { container } = renderWithQueryClientAndRouter(
      <PipelineRunStatus plr={plr} isTooltipVisible={false} />,
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(container.querySelector('[id^="pf-tooltip"]')).not.toBeInTheDocument();
  });

  it('renders as Label when isLabel is true', () => {
    const plr = testPipelineRuns[DataState.RUNNING];
    const { container } = renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} isLabel />);
    expect(container.querySelector('.pf-v6-c-label')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders Queued status for a queued PLR', () => {
    const plr = testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_PAC];
    renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
    expect(screen.getByText('Queued')).toBeInTheDocument();
  });
  describe('Kueue queue position', () => {
    const kueuePlr = testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_KUEUE];
    const withPosition = (position: number) =>
      mockUseKueuePosition.mockReturnValue({
        queuePosition: queuePosition(position),
        isLoading: false,
        error: undefined,
        hasPayload: true,
      });

    it('renders position#1 under Queued for the head of the queue (0-based API)', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      withPosition(0);
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);
      const lines = screen.getByText('Queued').parentElement;
      expect(lines).toHaveClass('registry-status-icon-with-text__lines');
      expect(within(lines).getByText('Queued')).toBeInTheDocument();
      expect(within(lines).getByText('position#1')).toBeInTheDocument();
    });

    it('renders position#N + 1 for later positions', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      withPosition(1);
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);
      expect(screen.getByText('position#2')).toBeInTheDocument();
    });

    it('shows only the wait in the tooltip, without position or priority', async () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      withPosition(1);
      const user = userEvent.setup();
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);

      await user.hover(screen.getByText('Queued'));
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Waiting for: 6 hours 12 minutes');
      expect(tooltip).not.toHaveTextContent('position#');
      expect(tooltip).not.toHaveTextContent('Priority');
    });

    it('keeps the wait tooltip but has no position line while the position is loading', async () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      mockUseKueuePosition.mockReturnValue({
        queuePosition: undefined,
        isLoading: true,
        error: undefined,
        hasPayload: false,
      });
      const user = userEvent.setup();
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);

      expect(screen.queryByText(/position#/)).not.toBeInTheDocument();
      await user.hover(screen.getByText('Queued'));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Waiting for: 6 hours 12 minutes',
      );
    });

    it('keeps the wait tooltip and has no position line when the fetch failed', async () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      mockUseKueuePosition.mockReturnValue({
        queuePosition: undefined,
        isLoading: false,
        error: new Error('Forbidden'),
        hasPayload: false,
      });
      const user = userEvent.setup();
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);

      expect(screen.queryByText(/position#/)).not.toBeInTheDocument();
      await user.hover(screen.getByText('Queued'));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Waiting for: 6 hours 12 minutes',
      );
    });

    it('keeps position#N when a later poll failed but the last position is still cached', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      mockUseKueuePosition.mockReturnValue({
        queuePosition: queuePosition(2),
        isLoading: false,
        error: new Error('NetworkError'),
        hasPayload: true,
      });
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);
      expect(screen.getByText('position#3')).toBeInTheDocument();
    });

    it('has no tooltip when creationTimestamp is missing', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      withPosition(0);
      const plr = {
        ...kueuePlr,
        metadata: { ...kueuePlr.metadata, creationTimestamp: undefined },
      } as PipelineRunKind;
      const { container } = renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
      expect(screen.getByText('position#1')).toBeInTheDocument();
      expect(
        container.querySelector('.registry-status-icon-with-text__help-text'),
      ).not.toBeInTheDocument();
    });

    it('shows neither position nor wait when the feature flag is off', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
      // The hook is a no-op with the flag off, so it returns no position.
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={kueuePlr} />);
      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.queryByText(/position#/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Waiting for:/)).not.toBeInTheDocument();
    });

    it('shows neither position nor wait for a PAC-only queued run', async () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      const user = userEvent.setup();
      renderWithQueryClientAndRouter(
        <PipelineRunStatus plr={testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_PAC]} />,
      );
      await user.hover(screen.getByText('Queued'));
      expect(screen.queryByText(/position#/)).not.toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(screen.queryByText(/Waiting for:/)).not.toBeInTheDocument();
    });

    it('shows neither position nor wait for a running run that still has the queue label', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      withPosition(0);
      const running = testPipelineRuns[DataState.RUNNING];
      const plr = {
        ...running,
        metadata: {
          ...running.metadata,
          labels: { ...running.metadata.labels, 'kueue.x-k8s.io/queue-name': 'default-queue' },
        },
      } as PipelineRunKind;
      renderWithQueryClientAndRouter(<PipelineRunStatus plr={plr} />);
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.queryByText(/position#/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Waiting for:/)).not.toBeInTheDocument();
    });

    it('does not render the second line when isLabel is true', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
      withPosition(0);
      const { container } = renderWithQueryClientAndRouter(
        <PipelineRunStatus plr={kueuePlr} isLabel />,
      );
      expect(screen.getByText('Queued')).toBeInTheDocument();
      expect(screen.queryByText(/position#/)).not.toBeInTheDocument();
      expect(container.querySelector('.registry-status-icon-with-text__lines')).toBeNull();
    });
  });
});
