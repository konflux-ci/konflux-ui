import { screen } from '@testing-library/react';
import { useComponents } from '../../../../hooks/useComponents';
import * as dateTime from '../../../../shared/components/timestamp/datetime';
import { getCommitsFromPLRs } from '../../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../../utils/pipeline-utils';
import { renderWithQueryClient } from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../__data__/pipeline-with-commits';
import CommitsListRow from '../CommitsListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../commit-status', () => ({
  useCommitStatus: () => ['-', true],
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

const useComponentsMock = useComponents as jest.Mock;

const commits = getCommitsFromPLRs(pipelineWithCommits);

describe('CommitsListRow', () => {
  beforeEach(() => {
    useComponentsMock.mockReturnValue([[{ metadata: { name: 'sample-component' } }], true]);
  });
  it('lists correct Commit details', () => {
    const { getAllByText, queryByText, container } = renderWithQueryClient(
      <CommitsListRow
        columns={null}
        obj={{ commit: commits[1], pipelineRuns: pipelineWithCommits }}
      />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[1].creationTime));
    expect(queryByText('commit1')).toBeInTheDocument();
    expect(getAllByText(`#11 ${commits[1].shaTitle}`)[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('branch_1')[0]).toBeInTheDocument();
    expect(getAllByText('sample-component')[0]).toBeInTheDocument();
  });

  it('lists correct Commit details for manual builds', () => {
    const { getAllByText, queryByText, container } = renderWithQueryClient(
      <CommitsListRow
        columns={null}
        obj={{ commit: commits[0], pipelineRuns: pipelineWithCommits }}
      />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit7')).toBeInTheDocument();
    expect(getAllByText('manual build')[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('manual-build-component')[0]).toBeInTheDocument();
  });

  it('should show commit icon for commits', () => {
    renderWithQueryClient(
      <CommitsListRow
        columns={null}
        obj={{ commit: commits[3], pipelineRuns: pipelineWithCommits }}
      />,
    );
    expect(screen.getByAltText('Commit icon')).toBeInTheDocument();
  });

  it('should show pull request icon for pull requests', () => {
    commits[0].isPullRequest = true;
    commits[0].pullRequestNumber = '23';
    renderWithQueryClient(
      <CommitsListRow
        columns={null}
        obj={{ commit: commits[0], pipelineRuns: pipelineWithCommits }}
      />,
    );
    screen.getByAltText('Pull request icon');
    screen.getAllByText(`#23 ${commits[0].shaTitle}`);
  });

  it('should show plr status on the row', () => {
    const status = pipelineRunStatus(commits[0].pipelineRuns[0]);
    renderWithQueryClient(
      <CommitsListRow
        columns={null}
        obj={{
          commit: commits[1],
          pipelineRuns: [pipelineWithCommits[0]],
        }}
      />,
    );
    screen.getByText(status);
  });
});
