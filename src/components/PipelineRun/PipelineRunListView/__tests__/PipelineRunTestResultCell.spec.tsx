import { render, screen } from '@testing-library/react';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import {
  AggregatedTestResult,
  usePipelineRunTestOutputResult,
} from '~/hooks/usePipelineRunTestOutputResult';
import { PipelineRunKind } from '~/types';
import { PipelineRunTestResultCell } from '../PipelineRunTestResultCell';

jest.mock('~/hooks/usePipelineRunTestOutputResult', () => ({
  usePipelineRunTestOutputResult: jest.fn(),
}));

const usePipelineRunTestOutputResultMock = usePipelineRunTestOutputResult as jest.Mock;

const defaultClassName = 'test-result-cell';

const renderCell = (plr: PipelineRunKind, namespace?: string) =>
  render(
    <table>
      <tbody>
        <tr>
          <PipelineRunTestResultCell plr={plr} className={defaultClassName} namespace={namespace} />
        </tr>
      </tbody>
    </table>,
  );

describe('PipelineRunTestResultCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePipelineRunTestOutputResultMock.mockReturnValue([null, false]);
  });

  it('renders loading skeleton when test result is loading', () => {
    usePipelineRunTestOutputResultMock.mockReturnValue([null, true]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
    ] as unknown as PipelineRunKind;
    const { container } = renderCell(plr, 'test-ns');
    expect(container.querySelector('.pf-v5-c-skeleton')).toBeInTheDocument();
  });

  it('renders "-" when there is no test result', () => {
    usePipelineRunTestOutputResultMock.mockReturnValue([null, false]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
    ] as unknown as PipelineRunKind;
    renderCell(plr, 'test-ns');
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders aggregated test output counts when result is available', () => {
    const aggregated: AggregatedTestResult = { successes: 3, failures: 1, warnings: 2 };
    usePipelineRunTestOutputResultMock.mockReturnValue([aggregated, false]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
    ] as unknown as PipelineRunKind;
    renderCell(plr, 'test-ns');
    expect(screen.getByLabelText('1 failure')).toBeInTheDocument();
    expect(screen.getByLabelText('2 warnings')).toBeInTheDocument();
    expect(screen.getByLabelText('3 successes')).toBeInTheDocument();
  });

  it('passes namespace to usePipelineRunTestOutputResult when PLR is finished', () => {
    const plr = testPipelineRuns[DataState.SUCCEEDED] as unknown as PipelineRunKind;
    renderCell(plr, 'my-namespace');
    expect(usePipelineRunTestOutputResultMock).toHaveBeenCalledWith('my-namespace', plr);
  });

  it('passes null namespace to usePipelineRunTestOutputResult when PLR is not finished', () => {
    const plr = testPipelineRuns[DataState.RUNNING] as unknown as PipelineRunKind;
    renderCell(plr, 'my-namespace');
    expect(usePipelineRunTestOutputResultMock).toHaveBeenCalledWith(null, plr);
  });
});
