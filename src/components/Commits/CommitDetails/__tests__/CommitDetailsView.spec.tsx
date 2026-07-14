import * as React from 'react';
import { BrowserRouter, useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useCommitStatus } from '~/components/Commits/commit-status';
import { runStatus } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
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

jest.mock('../../../../shared/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

jest.mock('../../../../hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

jest.mock('~/components/Commits/commit-status', () => ({
  useCommitStatus: jest.fn(),
}));

jest.mock('~/hooks/useStatusOnFavicon', () => ({
  useStatusOnFavicon: jest.fn(),
}));

jest.mock('../visualization/CommitVisualization', () => () => <div />);

const watchCommitPrsMock = usePipelineRunsForCommitV2 as jest.Mock;
const watchResourceMock = createK8sWatchResourceMock();
const watchParams = useParams as jest.Mock;
const useCommitStatusMock = useCommitStatus as jest.Mock;
const useStatusOnFaviconMock = useStatusOnFavicon as jest.Mock;

describe('CommitDetailsView', () => {
  beforeEach(() => {
    watchParams.mockReturnValue({ applicationName: 'test', commitName: 'commit123' });
    localStorage.removeItem(COMMITS_GS_LOCAL_STORAGE_KEY);
    watchResourceMock.mockReturnValue([pipelineWithCommits, true]);
    watchCommitPrsMock.mockReturnValue([pipelineWithCommits, true]);
    useCommitStatusMock.mockReturnValue([runStatus.Cancelled, true, undefined]);
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

  it('passes commit status to useStatusOnFavicon', () => {
    renderWithQueryClient(
      <BrowserRouter>
        <CommitDetailsView />
      </BrowserRouter>,
    );

    expect(useStatusOnFaviconMock).toHaveBeenCalledWith(runStatus.Cancelled);
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
