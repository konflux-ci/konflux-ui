import { fireEvent, screen } from '@testing-library/react';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupedConformaRow } from '../conforma-grouping-utils';
import { ConformaGroupedTable } from '../ConformaGroupedTable';
import type { ConformaResultRow } from '../useApplicationConformaResults';
import '@testing-library/jest-dom';

const createRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'A test description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  msg: 'Test message',
  ...overrides,
});

const mockGroups: GroupedConformaRow[] = [
  {
    groupKey: 'Missing CVE scan',
    violations: 2,
    warnings: 0,
    successes: 0,
    rows: [
      createRow({ title: 'Missing CVE scan', component: 'api-gateway' }),
      createRow({ title: 'Missing CVE scan', component: 'auth-service' }),
    ],
  },
  {
    groupKey: 'Base image allowed',
    violations: 0,
    warnings: 0,
    successes: 3,
    rows: [
      createRow({
        title: 'Base image allowed',
        component: 'api-gateway',
        status: CONFORMA_RESULT_STATUS.successes,
      }),
      createRow({
        title: 'Base image allowed',
        component: 'auth-service',
        status: CONFORMA_RESULT_STATUS.successes,
      }),
      createRow({
        title: 'Base image allowed',
        component: 'cache-manager',
        status: CONFORMA_RESULT_STATUS.successes,
      }),
    ],
  },
];

describe('ConformaGroupedTable', () => {
  const defaultProps = {
    groups: mockGroups,
    groupBy: 'rule' as const,
    expandedGroups: new Set<string>(),
    onToggleGroup: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders group rows with correct labels', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} />);

    expect(screen.getAllByText('Missing CVE scan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Base image allowed').length).toBeGreaterThanOrEqual(1);
  });

  it('renders count badges for each group', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} />);

    expect(screen.getByTestId('conforma-count-badge-violations')).toHaveTextContent('2');
    expect(screen.getByTestId('conforma-count-badge-successes')).toHaveTextContent('3');
  });

  it('renders "Rule" as group column header when groupBy is rule', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} groupBy="rule" />);

    expect(screen.getAllByText('Rule').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Component" as group column header when groupBy is component', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} groupBy="component" />);

    expect(screen.getAllByText('Component').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onToggleGroup when expand button is clicked', () => {
    const onToggle = jest.fn();
    routerRenderer(<ConformaGroupedTable {...defaultProps} onToggleGroup={onToggle} />);

    const toggleButtons = screen.getAllByRole('button');
    fireEvent.click(toggleButtons[0]);

    expect(onToggle).toHaveBeenCalledWith('Missing CVE scan');
  });

  it('shows detail sub-table when a group is expanded', () => {
    const expandedGroups = new Set(['Missing CVE scan']);
    routerRenderer(
      <ConformaGroupedTable {...defaultProps} expandedGroups={expandedGroups} />,
    );

    expect(screen.getAllByText('api-gateway').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('auth-service').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the correct data-test attribute', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} />);

    expect(screen.getByTestId('conforma-grouped-table')).toBeInTheDocument();
  });

  it('renders all column headers in expanded detail sub-table', () => {
    const expandedGroups = new Set(['Missing CVE scan']);
    routerRenderer(
      <ConformaGroupedTable {...defaultProps} expandedGroups={expandedGroups} />,
    );

    expect(screen.getAllByText('Image').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Message').length).toBeGreaterThanOrEqual(1);
  });
});
