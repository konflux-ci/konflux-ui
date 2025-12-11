import { screen } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import * as dateTime from '../../../../shared/components/timestamp/datetime';
import { getCommitsFromPLRs, getCommitSha } from '../../../../utils/commits-utils';
import { renderWithQueryClient } from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../__data__/pipeline-with-commits';
import { getCommitStatusFromPipelineRuns } from '../../commit-status';
import CommitsListRow from '../CommitsListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../commit-status', () => {
  const actual = jest.requireActual('../../commit-status');
  return {
    ...actual,
    useCommitStatus: () => [runStatus.Pending, true, undefined],
  };
});

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

const useComponentsMock = useComponents as jest.Mock;

const commits = getCommitsFromPLRs(pipelineWithCommits);

type CommitColumnKeys = 'name' | 'branch' | 'component' | 'byUser' | 'committedAt' | 'status';
const defaultVisibleColumns = new Set<CommitColumnKeys>([
  'name',
  'branch',
  'component',
  'byUser',
  'committedAt',
  'status',
]);

describe('CommitsListRow', () => {
  beforeEach(() => {
    useComponentsMock.mockReturnValue([[{ metadata: { name: 'sample-component' } }], true]);
  });
  it('lists correct Commit details', () => {
    const commitPipelineRuns = pipelineWithCommits.filter(
      (plr) => getCommitSha(plr) === commits[1].sha,
    );
    const status = getCommitStatusFromPipelineRuns(commitPipelineRuns);
    const { getAllByText, queryByText, container } = renderWithQueryClient(
      <CommitsListRow visibleColumns={defaultVisibleColumns} obj={commits[1]} status={status} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[1].creationTime));
    expect(queryByText('commit1')).toBeInTheDocument();
    expect(getAllByText(`#11 ${commits[1].shaTitle}`)[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('branch_1')[0]).toBeInTheDocument();
    expect(getAllByText('sample-component')[0]).toBeInTheDocument();
  });

  it('lists correct Commit details for manual builds', () => {
    const commitPipelineRuns = pipelineWithCommits.filter(
      (plr) => getCommitSha(plr) === commits[0].sha,
    );
    const status = getCommitStatusFromPipelineRuns(commitPipelineRuns);
    const { getAllByText, queryByText, container } = renderWithQueryClient(
      <CommitsListRow visibleColumns={defaultVisibleColumns} obj={commits[0]} status={status} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit7')).toBeInTheDocument();
    expect(getAllByText('manual build')[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('manual-build-component')[0]).toBeInTheDocument();
  });

  it('should show plr status on the row', () => {
    // Get all pipeline runs for this commit (not just the first one)
    const commitPipelineRuns = pipelineWithCommits.filter(
      (plr) => getCommitSha(plr) === commits[0].sha,
    );
    const status = getCommitStatusFromPipelineRuns(commitPipelineRuns);
    renderWithQueryClient(
      <CommitsListRow visibleColumns={defaultVisibleColumns} obj={commits[0]} status={status} />,
    );
    screen.getByText(status);
  });
});
