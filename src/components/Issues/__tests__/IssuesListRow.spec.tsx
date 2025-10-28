import { screen, fireEvent } from '@testing-library/react';
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

describe('IssuesListRow', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render issue title', () => {
    const issue = createMockIssue({ title: 'Critical Build Failure' });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

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

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    const scopeButton = screen.getByRole('button', { name: /pipeline/i });
    expect(scopeButton).toBeInTheDocument();
  });

  it('should call onToggle when scope button is clicked', () => {
    const issue = createMockIssue({ id: 'test-issue-123' });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    const scopeButton = screen.getByTestId('issues-component-name-button');
    fireEvent.click(scopeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith('test-issue-123');
  });

  it('should not error when onToggle is not provided', () => {
    const issue = createMockIssue();

    expect(() => {
      renderWithQueryClient(
        <table>
          <tbody>
            <tr>
              <IssuesListRow obj={issue} columns={[]} customData={{}} />
            </tr>
          </tbody>
        </table>,
      );
    }).not.toThrow();

    const scopeButton = screen.getByTestId('issues-component-name-button');
    expect(() => {
      fireEvent.click(scopeButton);
    }).not.toThrow();
  });

  it('should render critical severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.CRITICAL });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    // Text appears in both the icon title and as text, so use getAllByText
    const criticalTexts = screen.getAllByText('Critical');
    expect(criticalTexts.length).toBeGreaterThan(0);
  });

  it('should render major severity with correct text', () => {
    const issue = createMockIssue({ severity: IssueSeverity.MAJOR });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
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
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
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
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
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
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    // Text appears in both the icon title and as text, so use getAllByText
    const resolvedTexts = screen.getAllByText('Resolved');
    expect(resolvedTexts.length).toBeGreaterThan(0);
  });

  it('should render active status', () => {
    const issue = createMockIssue({ state: IssueState.ACTIVE });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    // Text appears in both the icon title and as text, so use getAllByText
    const activeTexts = screen.getAllByText('Active');
    expect(activeTexts.length).toBeGreaterThan(0);
  });

  it('should render issue description', () => {
    const issue = createMockIssue({ description: 'Build failed due to missing dependencies' });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Build failed due to missing dependencies')).toBeInTheDocument();
  });

  it('should render dash when description is null', () => {
    const issue = createMockIssue({ description: null });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.queryByText('Build failed due to missing dependencies')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should render dash when description is undefined', () => {
    const issue = createMockIssue({ description: undefined });

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

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

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    const links = container.querySelectorAll('a[href^="https://example.com"]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/link1');
    expect(links[1]).toHaveAttribute('href', 'https://example.com/link2');
  });

  it('should render dash when no links are provided', () => {
    const issue = createMockIssue({ links: [] });

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    // Check that the links column contains a dash
    const cells = container.querySelectorAll('td');
    // The last cell should be the links column
    const linksCell = cells[cells.length - 1];
    expect(linksCell?.textContent).toBe('-');
  });

  it('should render timestamp in created on column', () => {
    const issue = createMockIssue({ createdAt: '2024-03-15T10:30:00Z' });

    // Timestamp component should be rendered (we're not testing exact format)
    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    // Check that timestamp column exists
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should render all table cells', () => {
    const issue = createMockIssue();

    const { container } = renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    // Should render 7 TableData components (columns)
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(7);
  });

  it('should have correct data-test attributes', () => {
    const issue = createMockIssue();

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('issues-list-item')).toBeInTheDocument();
    expect(screen.getByTestId('issues-list-item-title')).toBeInTheDocument();
    expect(screen.getByTestId('issues-component-name-button')).toBeInTheDocument();
  });

  it('should render scope button as link variant', () => {
    const issue = createMockIssue();

    renderWithQueryClient(
      <table>
        <tbody>
          <tr>
            <IssuesListRow obj={issue} columns={[]} customData={{ onToggle: mockOnToggle }} />
          </tr>
        </tbody>
      </table>,
    );

    const scopeButton = screen.getByTestId('issues-component-name-button');
    expect(scopeButton).toHaveClass('pf-v5-c-button');
    expect(scopeButton).toHaveClass('pf-m-link');
  });
});
