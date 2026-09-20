import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { DataState, testPipelineRuns } from '../../../__data__/pipelinerun-data';
import PipelineRunStatus from '../PipelineRunStatus';

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

const mockUseTaskRuns = jest.mocked(useTaskRunsForPipelineRuns);

mockUseNamespaceHook('test-ns');

describe('PipelineRunStatus', () => {
  beforeEach(() => {
    mockUseTaskRuns.mockReturnValue([[], true, undefined, jest.fn(), {} as never]);
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

  it('fetches TaskRuns for failed PLRs', () => {
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
});
