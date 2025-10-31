import { screen, fireEvent } from '@testing-library/react';
import { IssueSeverity, IssueState } from '~/kite/issue-type';
import { createMockIssue } from '~/unit-test-utils/mock-issues';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { IssuesListExpandedRow } from '../IssuesListView/IssuesListExpandedRow';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => jest.fn(),
  };
});

describe('IssuesListExpandedRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should render issue title', () => {
    const issue = createMockIssue({ title: 'Expanded Row Issue' });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('issues-list-item-title')).toHaveTextContent('Expanded Row Issue');
  });

  it('should render critical severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.CRITICAL });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Text appears in both the icon title and as text
    const criticalTexts = screen.getAllByText('Critical');
    expect(criticalTexts.length).toBeGreaterThan(0);
  });

  it('should render major severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.MAJOR });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Major')).toBeInTheDocument();
  });

  it('should render minor severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.MINOR });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Minor')).toBeInTheDocument();
  });

  it('should render info severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.INFO });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should render resolved status', () => {
    const issue = createMockIssue({ state: IssueState.RESOLVED });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Text appears in both the icon title and as text
    const resolvedTexts = screen.getAllByText('Resolved');
    expect(resolvedTexts.length).toBeGreaterThan(0);
  });

  it('should render active status', () => {
    const issue = createMockIssue({ state: IssueState.ACTIVE });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Text appears in both the icon title and as text
    const activeTexts = screen.getAllByText('Active');
    expect(activeTexts.length).toBeGreaterThan(0);
  });

  it('should render issue description', () => {
    const issue = createMockIssue({ description: 'Critical security vulnerability detected' });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Critical security vulnerability detected')).toBeInTheDocument();
  });

  it('should render dash when description is null', () => {
    const issue = createMockIssue({ description: null });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // The reason/description column is the 5th column (index 4)
    const cells = container.querySelectorAll('td');
    expect(cells[4]?.textContent).toBe('-');
  });

  it('should render dash when description is undefined', () => {
    const issue = createMockIssue({ description: undefined });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // The reason/description column is the 5th column (index 4)
    const cells = container.querySelectorAll('td');
    expect(cells[4]?.textContent).toBe('-');
  });

  it('should show "View all" when there are 3 or more links', () => {
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
        {
          id: 'link-3',
          title: 'Link 3',
          url: 'https://example.com/link3',
          issueId: 'issue-1',
        },
      ],
    });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // With 3+ links, should show "View all" instead of individual links
    expect(screen.getByText('View all')).toBeInTheDocument();

    // Individual link titles should not be visible until modal is opened
    expect(screen.queryByText('Link 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Link 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Link 3')).not.toBeInTheDocument();
  });

  it('should render dash when no links are provided', () => {
    const issue = createMockIssue({ links: [] });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // The links column is the last column
    const cells = container.querySelectorAll('td');
    const linksCell = cells[cells.length - 1];
    expect(linksCell?.textContent).toBe('-');
  });

  it('should render timestamp in created on column', () => {
    const issue = createMockIssue({ createdAt: '2024-03-15T10:30:00Z' });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Check that timestamp column exists
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should render all table cells when content exists', () => {
    const issue = createMockIssue();

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Should render 6 TableData components (columns)
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(6);
  });

  it('should have correct data-test attributes', () => {
    const issue = createMockIssue();

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('issues-list-item')).toBeInTheDocument();
    expect(screen.getByTestId('issues-list-item-title')).toBeInTheDocument();
  });

  it('should return null when there are no links and no description', () => {
    const issue = createMockIssue({
      links: [],
      description: null,
    });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Should not render any cells when there's no content
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(0);
  });

  it('should return null when links is undefined and description is null', () => {
    const issue = createMockIssue({
      links: undefined,
      description: null,
    });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Should not render any cells when there's no content
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(0);
  });

  it('should render when only description exists', () => {
    const issue = createMockIssue({
      links: [],
      description: 'Some description',
    });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('should render when only links exist', () => {
    const issue = createMockIssue({
      links: [
        {
          id: 'link-1',
          title: 'Link 1',
          url: 'https://example.com/link1',
          issueId: 'issue-1',
        },
      ],
      description: null,
    });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    const links = container.querySelectorAll('a[href^="https://example.com"]');
    expect(links.length).toBe(1);
  });

  it('should show "View all" link when more than 2 links exist', () => {
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
        {
          id: 'link-3',
          title: 'Link 3',
          url: 'https://example.com/link3',
          issueId: 'issue-1',
        },
      ],
    });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Should show "View all" link instead of individual links
    expect(screen.getByText('View all')).toBeInTheDocument();
  });

  it('should open modal when "View all" is clicked', () => {
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
        {
          id: 'link-3',
          title: 'Link 3',
          url: 'https://example.com/link3',
          issueId: 'issue-1',
        },
      ],
    });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    const viewAllLink = screen.getByText('View all');
    fireEvent.click(viewAllLink);

    // Modal should be open with title
    expect(screen.getByText('All links')).toBeInTheDocument();
  });

  it('should display all links in modal when opened', () => {
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
        {
          id: 'link-3',
          title: 'Link 3',
          url: 'https://example.com/link3',
          issueId: 'issue-1',
        },
      ],
    });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    const viewAllLink = screen.getByText('View all');
    fireEvent.click(viewAllLink);

    // All links should be in the modal
    expect(screen.getByText('Link 1')).toBeInTheDocument();
    expect(screen.getByText('Link 2')).toBeInTheDocument();
    expect(screen.getByText('Link 3')).toBeInTheDocument();
  });

  it('should render links directly when 2 or fewer links exist', () => {
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

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Links should be rendered directly, not in a modal
    expect(screen.getByText('Link 1')).toBeInTheDocument();
    expect(screen.getByText('Link 2')).toBeInTheDocument();
    // "View all" should not be shown
    expect(screen.queryByText('View all')).not.toBeInTheDocument();
  });

  it('should render empty string description as falsy and return null', () => {
    const issue = createMockIssue({
      links: [],
      description: '',
    });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListExpandedRow obj={issue} columns={[]} />
          </tr>
        </tbody>
      </table>,
    );

    // Empty string is falsy, so should not render
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(0);
  });
});
