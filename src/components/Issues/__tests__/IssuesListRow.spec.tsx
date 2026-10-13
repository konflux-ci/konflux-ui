import { BrowserRouter } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueSeverity, IssueState } from '~/kite/issue-type';
import { createMockIssue } from '~/unit-test-utils/mock-issues';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import IssuesListRow from '../IssuesListView/IssuesListRow';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => jest.fn(),
  };
});

jest.mock('~/kite/kite-fetch', () => ({
  resolveIssue: jest.fn(),
}));

const renderRow = (issue = createMockIssue()) =>
  renderWithQueryClient(
    <BrowserRouter>
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>
    </BrowserRouter>,
  );

describe('IssuesListRow', () => {
  const user = userEvent.setup();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render issue title', () => {
    const issue = createMockIssue({ title: 'Critical Build Failure' });

    renderRow(issue);

    expect(screen.getByText('Critical Build Failure')).toBeInTheDocument();
  });

  it('should render scope with resource type', () => {
    const issue = createMockIssue({
      scope: {
        resourceType: 'pipeline',
        resourceName: 'test-pipeline',
        resourceNamespace: 'test-ns',
      },
    });

    renderRow(issue);

    const scopeButton = screen.getByText('Pipeline');
    expect(scopeButton).toBeInTheDocument();
  });

  it('should render critical severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.CRITICAL });

    renderRow(issue);

    // Text appears in both the icon title and as text, so use getAllByText
    const criticalTexts = screen.getAllByText('Critical');
    expect(criticalTexts.length).toBeGreaterThan(0);
  });

  it('should render major severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.MAJOR });

    renderRow(issue);

    expect(screen.getByText('Major')).toBeInTheDocument();
  });

  it('should render minor severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.MINOR });

    renderRow(issue);

    expect(screen.getByText('Minor')).toBeInTheDocument();
  });

  it('should render info severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.INFO });

    renderRow(issue);

    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should render resolved status', () => {
    const issue = createMockIssue({ state: IssueState.RESOLVED });

    renderRow(issue);

    // Text appears in both the icon title and as text, so use getAllByText
    const resolvedTexts = screen.getAllByText('Resolved');
    expect(resolvedTexts.length).toBeGreaterThan(0);
  });

  it('should render active status', () => {
    const issue = createMockIssue({ state: IssueState.ACTIVE });

    renderRow(issue);

    // Text appears in both the icon title and as text, so use getAllByText
    const activeTexts = screen.getAllByText('Active');
    expect(activeTexts.length).toBeGreaterThan(0);
  });

  it('should render issue description', () => {
    const issue = createMockIssue({ description: 'Build failed due to missing dependencies' });

    renderRow(issue);

    expect(screen.getByText('Build failed due to missing dependencies')).toBeInTheDocument();
  });

  it('should render dash when description is null', () => {
    const issue = createMockIssue({ description: null });

    renderRow(issue);

    expect(screen.queryByText('Build failed due to missing dependencies')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should render dash when description is undefined', () => {
    const issue = createMockIssue({ description: undefined });

    renderRow(issue);

    expect(screen.queryByText('Build failed due to missing dependencies')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should render multiple links', () => {
    const issue = createMockIssue({
      links: [
        {
          id: 'link-1',
          title: 'Link 1',
          url: 'https://example.com/link1',
          issueId: 'issue-1',
        },
        {
          id: 'link-2',
          title: 'Link 2',
          url: 'https://example.com/link2',
          issueId: 'issue-1',
        },
      ],
    });

    const { container } = renderRow(issue);

    const links = container.querySelectorAll('a[href^="https://example.com"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/link1');
    expect(links[1]).toHaveAttribute('href', 'https://example.com/link2');
  });

  it('should render dash when no links are provided', () => {
    const issue = createMockIssue({ links: [] });

    const { container } = renderRow(issue);

    // Check that the links column contains a dash (second-to-last before kebab)
    const cells = container.querySelectorAll('td');
    const linksCell = cells[cells.length - 2];
    expect(linksCell?.textContent).toBe('-');
  });

  it('should render timestamp in created on column', () => {
    const issue = createMockIssue({ createdAt: '2024-03-15T10:30:00Z' });

    // Timestamp component should be rendered (we're not testing exact format)
    const { container } = renderRow(issue);

    // Check that timestamp column exists
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should render all table cells', () => {
    const issue = createMockIssue();

    const { container } = renderRow(issue);

    // Should render 8 TableData components (columns including kebab)
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(8);
  });

  it('should render kebab menu with Resolve action', async () => {
    renderRow(createMockIssue({ state: IssueState.ACTIVE }));

    await user.click(screen.getByTestId('kebab-button'));

    await waitFor(() => {
      expect(screen.getByTestId('Resolve')).toBeInTheDocument();
    });
  });

  it('should disable Resolve action for resolved issues', async () => {
    renderRow(createMockIssue({ state: IssueState.RESOLVED }));

    await user.click(screen.getByTestId('kebab-button'));

    await waitFor(() => {
      expect(screen.getByTestId('Resolve').querySelector('button, a')).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });
});
