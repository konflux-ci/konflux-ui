import { MemoryRouter } from 'react-router-dom';
import { IssueSeverity, IssueState, IssueType } from '~/kite/issue-type';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import IssuesOverview from '../IssuesOverview';

const mockIssues = [
  {
    id: '1',
    title: 'Critical security issue',
    state: IssueState.ACTIVE,
    severity: IssueSeverity.CRITICAL,
    type: IssueType.PIPELINE,
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-11T10:00:00Z',
  },
  {
    id: '2',
    title: 'Major performance issue',
    state: IssueState.ACTIVE,
    severity: IssueSeverity.MAJOR,
    type: IssueType.BUILD,
    createdAt: '2025-11-10T11:00:00Z',
    updatedAt: '2025-11-11T11:00:00Z',
  },
  {
    id: '3',
    title: 'Minor UI bug',
    state: IssueState.RESOLVED,
    severity: IssueSeverity.MINOR,
    type: IssueType.DEPENDENCY,
    createdAt: '2025-11-10T12:00:00Z',
    updatedAt: '2025-11-11T12:00:00Z',
  },
];

jest.mock('~/kite/kite-hooks', () => ({
  ...jest.requireActual('~/kite/kite-hooks'),
  useIssues: jest.fn(() => ({
    data: { data: mockIssues, total: mockIssues.length },
    isLoading: false,
    error: null,
  })),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));

describe('IssuesOverview', () => {
  const renderComponent = () => {
    return renderWithQueryClient(
      <MemoryRouter>
        <IssuesOverview />
      </MemoryRouter>,
    );
  };

  it('should render without crashing', () => {
    const { container } = renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('should render the grid layout with correct structure', () => {
    const { container } = renderComponent();

    // Outer grid should exist
    const outerGrid = container.querySelector('.pf-v6-l-grid');
    expect(outerGrid).toBeInTheDocument();

    // Outer grid should have 2 direct grid-item children (left column + right column)
    const outerGridItems = Array.from(outerGrid.children).filter((child) =>
      child.classList.contains('pf-v6-l-grid__item'),
    );
    expect(outerGridItems).toHaveLength(2);

    // Left column should contain a nested grid with 2 grid items
    const nestedGrid = outerGridItems[0].querySelector('.pf-v6-l-grid');
    expect(nestedGrid).toBeInTheDocument();

    const nestedGridItems = Array.from(nestedGrid.children).filter((child) =>
      child.classList.contains('pf-v6-l-grid__item'),
    );
    expect(nestedGridItems).toHaveLength(2);
  });
});
