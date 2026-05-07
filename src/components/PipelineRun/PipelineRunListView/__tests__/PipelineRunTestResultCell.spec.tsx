import { render, screen } from '@testing-library/react';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { runStatus } from '~/consts/pipelinerun';
import { usePipelineRunTestOutputResult } from '~/hooks/usePipelineRunTestOutputResult';
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
    usePipelineRunTestOutputResultMock.mockReturnValue([null, false, undefined]);
  });

  it('renders loading skeleton when test result is loading', () => {
    usePipelineRunTestOutputResultMock.mockReturnValue([null, true, undefined]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
    ] as unknown as PipelineRunKind;
    const { container } = renderCell(plr, 'test-ns');
    expect(container.querySelector('.pf-v5-c-skeleton')).toBeInTheDocument();
  });

  it('renders "-" when there is no test result', () => {
    usePipelineRunTestOutputResultMock.mockReturnValue([null, false, undefined]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITHOUT_TEST_OUTPUT_INFO
    ] as unknown as PipelineRunKind;
    renderCell(plr, 'test-ns');
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders status text when test result is Succeeded', () => {
    usePipelineRunTestOutputResultMock.mockReturnValue([
      runStatus.Succeeded,
      false,
      'All tests passed',
    ]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITH_TEST_OUTPUT_SUCCESS
    ] as unknown as PipelineRunKind;
    renderCell(plr, 'test-ns');
    expect(screen.getByText(runStatus.Succeeded)).toBeInTheDocument();
  });

  it('renders status text when test result is TestFailed', () => {
    usePipelineRunTestOutputResultMock.mockReturnValue([
      runStatus.TestFailed,
      false,
      'Tests failed',
    ]);
    const plr = testPipelineRuns[
      DataState.STATUS_WITH_TEST_OUTPUT_ERROR
    ] as unknown as PipelineRunKind;
    renderCell(plr, 'test-ns');
    expect(screen.getByText(runStatus.TestFailed)).toBeInTheDocument();
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
