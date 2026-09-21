import { screen } from '@testing-library/react';
import { PipelineRunEventType } from '~/consts/pipelinerun';
import { routerRenderer } from '~/unit-test-utils';
import { TriggerColumnData } from '../trigger-column-data';

jest.mock('../../../../assets/code-commit.svg', () => () => <svg data-test="commit-icon" />);
jest.mock('../../../../assets/code-pull-request.svg', () => () => <svg data-test="pr-icon" />);

describe('TriggerColumnData', () => {
  it('should render dash when eventType is missing', () => {
    routerRenderer(<TriggerColumnData commitSha="abc1234567890" eventType={undefined} shaUrl="" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should render dash when commitSha is missing', () => {
    routerRenderer(
      <TriggerColumnData commitSha="" eventType={PipelineRunEventType.PUSH} shaUrl="" />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  describe('commit display', () => {
    it('should use CommitLabel component for commit SHA display', () => {
      routerRenderer(
        <TriggerColumnData
          commitSha="abc1234567890"
          eventType={PipelineRunEventType.PUSH}
          shaUrl="https://github.com/org/repo/commit/abc1234567890"
          gitProvider="github"
        />,
      );
      expect(screen.getByTestId('commit-label-abc1234')).toBeInTheDocument();
    });
  });

  describe('pull request display', () => {
    it('should show #<number> for GitHub pull requests', () => {
      routerRenderer(
        <TriggerColumnData
          commitSha="abc1234567890"
          eventType={PipelineRunEventType.PULL}
          shaUrl="https://github.com/org/repo/commit/abc1234567890"
          repoURL="https://github.com/org/repo"
          prNumber="42"
          gitProvider="github"
        />,
      );
      const prLink = screen.getByRole('link', { name: '#42' });
      expect(prLink).toHaveAttribute('href', 'https://github.com/org/repo/pull/42');
    });

    it('should show !<number> for GitLab merge requests', () => {
      routerRenderer(
        <TriggerColumnData
          commitSha="abc1234567890"
          eventType={PipelineRunEventType.PULL}
          shaUrl="https://gitlab.com/org/repo/-/commit/abc1234567890"
          repoURL="https://gitlab.com/org/repo"
          prNumber="42"
          gitProvider="gitlab"
        />,
      );
      const mrLink = screen.getByRole('link', { name: '!42' });
      expect(mrLink).toHaveAttribute('href', 'https://gitlab.com/org/repo/-/merge_requests/42');
    });

    it('should show #<number> for Bitbucket pull requests', () => {
      routerRenderer(
        <TriggerColumnData
          commitSha="abc1234567890"
          eventType={PipelineRunEventType.PULL}
          shaUrl="https://bitbucket.org/org/repo/commits/abc1234567890"
          repoURL="https://bitbucket.org/org/repo"
          prNumber="10"
          gitProvider="bitbucket"
        />,
      );
      const prLink = screen.getByRole('link', { name: '#10' });
      expect(prLink).toHaveAttribute('href', 'https://bitbucket.org/org/repo/pull-requests/10');
    });

    it('should not render PR link when prNumber is missing', () => {
      routerRenderer(
        <TriggerColumnData
          commitSha="abc1234567890"
          eventType={PipelineRunEventType.PULL}
          shaUrl="https://github.com/org/repo/commit/abc1234567890"
          repoURL="https://github.com/org/repo"
          gitProvider="github"
        />,
      );
      expect(screen.queryByRole('link', { name: /#\d+/ })).not.toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should render icon and PR link on the same row', () => {
      const { container } = routerRenderer(
        <TriggerColumnData
          commitSha="abc1234567890"
          eventType={PipelineRunEventType.PULL}
          shaUrl="https://github.com/org/repo/commit/abc1234567890"
          repoURL="https://github.com/org/repo"
          prNumber="42"
          gitProvider="github"
        />,
      );
      const flex = container.querySelector('.pf-v6-l-flex');
      expect(flex).toBeInTheDocument();
    });
  });
});
