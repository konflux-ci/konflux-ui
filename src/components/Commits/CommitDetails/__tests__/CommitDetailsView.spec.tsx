import * as React from 'react';
import { BrowserRouter, useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { getCommitShortName } from '../../../../utils/commits-utils';
import { createK8sWatchResourceMock, renderWithQueryClient } from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../__data__/pipeline-with-commits';
import CommitDetailsView, { COMMITS_GS_LOCAL_STORAGE_KEY } from '../CommitDetailsView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => {},
    useSearchParams: () => React.useState(() => new URLSearchParams()),
    useParams: jest.fn(),
    useLocation: () => ({ pathname: '/path/name' }),
  };
});

jest.mock('../../../../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock('../../../../hooks/usePipelineRuns', () => ({
  usePipelineRunsForCommit: jest.fn(),
}));

jest.mock('../visualization/CommitVisualization', () => () => <div />);

const watchCommitPrsMock = usePipelineRunsForCommit as jest.Mock;
const watchResourceMock = createK8sWatchResourceMock();
const watchParams = useParams as jest.Mock;

describe('CommitDetailsView', () => {
  beforeEach(() => {
    watchParams.mockReturnValue({ applicationName: 'test', commitName: 'commit123' });
    localStorage.removeItem(COMMITS_GS_LOCAL_STORAGE_KEY);
    watchResourceMock.mockReturnValue([pipelineWithCommits, true]);
    watchCommitPrsMock.mockReturnValue([pipelineWithCommits, true]);
  });

  it('should render spinner while pipeline data is not loaded', () => {
    watchResourceMock.mockReturnValueOnce([[], false]);
    watchCommitPrsMock.mockReturnValueOnce([[], false]);
    renderWithQueryClient(<CommitDetailsView />);
    screen.getByRole('progressbar');
  });

  it('should show plr fetching error if unable to load plrs', () => {
    watchResourceMock.mockReturnValueOnce([[], true, { code: 503 }]);
    watchCommitPrsMock.mockReturnValueOnce([[], true, { code: 503 }]);
    renderWithQueryClient(<CommitDetailsView />);
    screen.getByText('Unable to load commit details');
  });

  it('should show commit not found error if no matching pipelineruns are found ', () => {
    watchResourceMock.mockReturnValueOnce([[], true]);
    watchCommitPrsMock.mockReturnValueOnce([[], true]);
    renderWithQueryClient(<CommitDetailsView />);
    screen.getByText('404: Page not found');
    screen.getByText('Go to applications list');
  });

  it('should render proper commit details', () => {
    renderWithQueryClient(
      <BrowserRouter>
        <CommitDetailsView />
      </BrowserRouter>,
    );
    screen.getAllByText(getCommitShortName('commit123'));
  });

  it('should not use integration test pipeline to get details', () => {
    watchResourceMock.mockReturnValue([[pipelineWithCommits[0], pipelineWithCommits[4]], true]);
    renderWithQueryClient(
      <BrowserRouter>
        <CommitDetailsView />
      </BrowserRouter>,
    );
    expect(screen.queryByRole('test-title-4')).toBeNull();
  });
});
