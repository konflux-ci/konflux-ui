import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { routerRenderer } from '~/unit-test-utils';
import '@testing-library/jest-dom';
import { GitProvider } from '../../../../shared/utils/git-utils';
import CommitLabel from '../CommitLabel';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock(
  '../../../../shared/assets/forgejo-logo.svg',
  () => (props: { 'aria-label'?: string }) => React.createElement('svg', props),
);

const sha = '9135b3ad0a2c16726523b12cf3b8f0365be33566';
const shaURL =
  'https://github.com/test-owner/test-repo/commit/9135b3ad0a2c16726523b12cf3b8f0365be33566';

describe('CommitLabel', () => {
  it.each(['forgejo', 'gitea'])(
    'should render the Forgejo icon and tooltip for %s',
    async (gitProvider) => {
      const user = userEvent.setup();
      routerRenderer(<CommitLabel gitProvider={gitProvider} sha={sha} shaURL={shaURL} />);
      expect(screen.getByRole('img', { name: 'Forgejo' })).toBeInTheDocument();
      await user.hover(screen.getByRole('link'));
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Open in Forgejo');
    },
  );

  it('should render commit label', () => {
    const label = render(<CommitLabel gitProvider="github" sha={sha} shaURL={shaURL} />);
    const link = label.getByTestId(`commit-label-9135b3a`);
    expect(link).toBeInTheDocument();
    expect(label.getByRole('link')).toHaveAttribute('href', shaURL);
  });
  it('should render the correct provider icon', () => {
    let label = render(<CommitLabel gitProvider={GitProvider.GITHUB} sha={sha} shaURL={shaURL} />);
    let icon = label.queryByTestId(`git-hub-icon`);
    const link = label.getByTestId(`commit-label-9135b3a`);
    expect(icon).toBeInTheDocument();
    expect(link.parentElement).toHaveClass('black-icon');
    label.unmount();

    label = render(<CommitLabel gitProvider={GitProvider.GITLAB} sha={sha} shaURL={shaURL} />);
    icon = label.queryByTestId(`git-lab-icon`);
    expect(icon).toBeInTheDocument();
    label.unmount();

    label = render(<CommitLabel gitProvider={GitProvider.BITBUCKET} sha={sha} shaURL={shaURL} />);
    icon = label.queryByTestId(`bit-bucket-icon`);
    expect(icon).toBeInTheDocument();
    label.unmount();

    label = render(<CommitLabel gitProvider={GitProvider.FORGEJO} sha={sha} shaURL={shaURL} />);
    const forgejoIcon = label.container.querySelector('svg[aria-label="Forgejo"]');
    expect(forgejoIcon).toBeInTheDocument();
    label.unmount();

    label = render(<CommitLabel gitProvider={GitProvider.UNSURE} sha={sha} shaURL={shaURL} />);
    expect(label.queryByTestId(`git-hub-icon`)).not.toBeInTheDocument();
    expect(label.queryByTestId(`git-lab-icon`)).not.toBeInTheDocument();
    expect(label.queryByTestId(`bit-bucket-icon`)).not.toBeInTheDocument();
    label.unmount();

    label = render(<CommitLabel gitProvider={undefined} sha={sha} shaURL={shaURL} />);
    expect(label.queryByTestId(`git-hub-icon`)).not.toBeInTheDocument();
    expect(label.queryByTestId(`git-lab-icon`)).not.toBeInTheDocument();
    expect(label.queryByTestId(`bit-bucket-icon`)).not.toBeInTheDocument();
  });
});
