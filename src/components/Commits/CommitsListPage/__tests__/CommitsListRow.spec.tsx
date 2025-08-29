import { render, screen } from '@testing-library/react';
import * as dateTime from '../../../../shared/components/timestamp/datetime';
import { getCommitsFromPLRs } from '../../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../../utils/pipeline-utils';
import { pipelineWithCommits } from '../../__data__/pipeline-with-commits';
import CommitsListRow from '../CommitsListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../commit-status', () => ({
  useCommitStatus: () => ['-', true],
}));

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
  it('lists correct Commit details', () => {
    const { getAllByText, queryByText, container } = render(
      <CommitsListRow visibleColumns={defaultVisibleColumns} obj={commits[1]} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[1].creationTime));
    expect(queryByText('commit1')).toBeInTheDocument();
    expect(getAllByText(`#11 ${commits[1].shaTitle}`)[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('branch_1')[0]).toBeInTheDocument();
    expect(getAllByText('sample-component')[0]).toBeInTheDocument();
  });

  it('lists correct Commit details for manual builds', () => {
    const { getAllByText, queryByText, container } = render(
      <CommitsListRow visibleColumns={defaultVisibleColumns} obj={commits[0]} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit7')).toBeInTheDocument();
    expect(getAllByText('manual build')[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('manual-build-component')[0]).toBeInTheDocument();
  });

  it('should show plr status on the row', () => {
    const status = pipelineRunStatus(commits[0].pipelineRuns[0]);
    render(<CommitsListRow visibleColumns={defaultVisibleColumns} obj={commits[0]} />);
    screen.getByText(status);
  });
});
