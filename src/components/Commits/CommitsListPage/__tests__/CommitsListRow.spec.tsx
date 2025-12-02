import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const { getAllByText, queryByText, container } = renderWithQueryClient(
      <CommitsListRow
        visibleColumns={defaultVisibleColumns}
        obj={commits[1]}
        pipelineRuns={pipelineWithCommits}
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
        visibleColumns={defaultVisibleColumns}
        obj={commits[0]}
        pipelineRuns={pipelineWithCommits}
      />,
    );
    const expectedDate = dateTime.dateTimeFormatter.format(new Date(commits[0].creationTime));
    expect(queryByText('commit7')).toBeInTheDocument();
    expect(getAllByText('manual build')[0]).toBeInTheDocument();
    expect(container).toHaveTextContent(expectedDate.toString());
    expect(getAllByText('manual-build-component')[0]).toBeInTheDocument();
  });

  it('should show plr status on the row', () => {
    const status = pipelineRunStatus(commits[0].pipelineRuns[0]);
    renderWithQueryClient(
      <CommitsListRow
        visibleColumns={defaultVisibleColumns}
        obj={commits[0]}
        pipelineRuns={pipelineWithCommits}
      />,
    );
    screen.getByText(status);
  });

  describe('Component list display', () => {
    it('should display first 3 components when there are more than 3 components', () => {
      const commitWithManyComponents = {
        ...commits[0],
        components: ['frontend', 'backend', 'database', 'auth-service', 'api-gateway'],
      };

      renderWithQueryClient(
        <CommitsListRow
          visibleColumns={defaultVisibleColumns}
          obj={commitWithManyComponents}
          pipelineRuns={pipelineWithCommits}
        />,
      );

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
      expect(screen.getByText('database')).toBeInTheDocument();
      expect(screen.queryByText('auth-service')).not.toBeInTheDocument();
      expect(screen.queryByText('api-gateway')).not.toBeInTheDocument();
    });

    it('should show "more" popover button when there are more than 3 components', () => {
      const commitWithManyComponents = {
        ...commits[0],
        components: ['frontend', 'backend', 'database', 'auth-service', 'api-gateway'],
      };

      renderWithQueryClient(
        <CommitsListRow
          visibleColumns={defaultVisibleColumns}
          obj={commitWithManyComponents}
          pipelineRuns={pipelineWithCommits}
        />,
      );

      expect(screen.getByText('2 more')).toBeInTheDocument();
    });

    it('should display all hidden components in popover when clicked', async () => {
      const user = userEvent.setup();
      const commitWithManyComponents = {
        ...commits[0],
        components: ['frontend', 'backend', 'database', 'auth-service', 'api-gateway'],
      };

      renderWithQueryClient(
        <CommitsListRow
          visibleColumns={defaultVisibleColumns}
          obj={commitWithManyComponents}
          pipelineRuns={pipelineWithCommits}
        />,
      );

      const moreButton = screen.getByText('2 more');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('auth-service')).toBeInTheDocument();
        expect(screen.getByText('api-gateway')).toBeInTheDocument();
      });
    });

    it('should not show popover when there are 3 or fewer components', () => {
      const commitWithFewComponents = {
        ...commits[0],
        components: ['frontend', 'backend'],
      };

      renderWithQueryClient(
        <CommitsListRow
          visibleColumns={defaultVisibleColumns}
          obj={commitWithFewComponents}
          pipelineRuns={pipelineWithCommits}
        />,
      );

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('more-components-popover')).not.toBeInTheDocument();
    });

    it('should display "-" when there are no components', () => {
      const commitWithNoComponents = {
        ...commits[0],
        components: [],
      };

      const { container } = renderWithQueryClient(
        <CommitsListRow
          visibleColumns={defaultVisibleColumns}
          obj={commitWithNoComponents}
          pipelineRuns={pipelineWithCommits}
        />,
      );

      const componentListDiv = container.querySelector('.commits-component-list');
      expect(componentListDiv).toBeInTheDocument();
      expect(componentListDiv).toHaveTextContent('-');
      expect(screen.queryByTestId('more-components-popover')).not.toBeInTheDocument();
    });
  });
});
