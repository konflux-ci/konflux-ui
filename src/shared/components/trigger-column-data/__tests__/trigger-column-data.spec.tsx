import { render, screen } from '@testing-library/react';
import { PipelineRunEventType } from '~/consts/pipelinerun';
import { TriggerColumnData } from '../trigger-column-data';

describe('TriggerColumnData', () => {
  it('renders icon and commit link on one row for push events', () => {
    render(
      <TriggerColumnData
        eventType={PipelineRunEventType.PUSH}
        commitSha="abcdef1234567890"
        shaUrl="https://github.com/org/repo/commit/abcdef1234567890"
        repoURL="https://github.com/org/repo"
      />,
    );

    expect(screen.getByLabelText('Commit icon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'abcdef1' })).toHaveAttribute(
      'href',
      'https://github.com/org/repo/commit/abcdef1234567890',
    );
  });

  it('renders PR link on first row and commit link on second row for pull request events', () => {
    const { container } = render(
      <TriggerColumnData
        eventType={PipelineRunEventType.PULL}
        commitSha="commit1234567890"
        shaUrl="https://github.com/test/test-repo/commit/commit1234567890"
        repoURL="https://github.com/test/test-repo"
        repoOrg="openshift"
        repoName="console"
        prNumber="11"
      />,
    );

    expect(screen.getByLabelText('Pull request icon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'openshift/console/11' })).toHaveAttribute(
      'href',
      'https://github.com/test/test-repo/pull/11',
    );
    expect(screen.getByRole('link', { name: 'commit1' })).toHaveAttribute(
      'href',
      'https://github.com/test/test-repo/commit/commit1234567890',
    );

    const root = container.querySelector('.trigger-column-data--with-pr');
    expect(root).toBeInTheDocument();
    expect(root?.querySelectorAll('.trigger-column-data__row')).toHaveLength(2);
    expect(root?.querySelector('.trigger-column-data__row--sha')).toContainElement(
      screen.getByRole('link', { name: 'commit1' }),
    );
  });

  it('truncates long pull request labels', () => {
    const longPrLabel = 'very-long-organization-name/very-long-repository-name/12345';
    const { container } = render(
      <TriggerColumnData
        eventType={PipelineRunEventType.PULL}
        commitSha="commit1234567890"
        shaUrl="https://github.com/test/test-repo/commit/commit1234567890"
        repoURL="https://github.com/test/test-repo"
        repoOrg="very-long-organization-name"
        repoName="very-long-repository-name"
        prNumber="12345"
      />,
    );

    const prLinkWrap = container.querySelector('.trigger-column-data__pr-link-wrap');
    expect(prLinkWrap).toHaveAttribute('title', longPrLabel);

    const prLinkText = prLinkWrap?.querySelector('.trigger-column-data__pr-link-text');
    expect(prLinkText?.textContent).toBe('very-long-organiz...');
    expect(prLinkText?.textContent?.endsWith('...')).toBe(true);
    expect(prLinkText?.textContent?.length).toBeLessThanOrEqual(20);
  });

  it('returns placeholder when commit data is missing', () => {
    render(<TriggerColumnData eventType={PipelineRunEventType.PUSH} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
