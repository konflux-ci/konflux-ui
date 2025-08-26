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

describe('CommitsListRow', () => {
  it('lists correct Commit details', () => {
    const { getAllByText, queryByText, container } = render(
      <CommitsListRow columns={null} obj={commits[1]} />,
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
      <CommitsListRow columns={null} obj={commits[0]} />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit7')).toBeInTheDocument();
    expect(getAllByText('manual build')[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('manual-build-component')[0]).toBeInTheDocument();
  });

  it('should show commit icon for commits', () => {
    render(<CommitsListRow columns={null} obj={commits[3]} />);
    expect(screen.getByLabelText('Commit icon')).toBeInTheDocument();
  });

  it('should show pull request icon for pull requests', () => {
    commits[0].isPullRequest = true;
    commits[0].pullRequestNumber = '23';
    render(<CommitsListRow columns={null} obj={commits[0]} />);
    screen.getByLabelText('Pull request icon');
    screen.getAllByText(`#23 ${commits[0].shaTitle}`);
  });

  it('should show plr status on the row', () => {});
  const status = pipelineRunStatus(commits[0].pipelineRuns[0]);
  render(<CommitsListRow columns={null} obj={commits[0]} />);
  screen.getByText(status);
});
