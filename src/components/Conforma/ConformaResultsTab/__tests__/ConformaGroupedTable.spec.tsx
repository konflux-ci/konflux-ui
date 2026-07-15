import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { ConformaResultRow } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import type { GroupedConformaRow } from '../conforma-grouping-utils';
import { ConformaGroupedTable } from '../ConformaGroupedTable';
import '@testing-library/jest-dom';

const createRow = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Test rule',
  description: 'A test description',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'test-component',
  msg: 'Test message',
  images: [],
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

    expect(
      screen.getByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.violations}`),
    ).toHaveTextContent('2');
    expect(
      screen.getByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.successes}`),
    ).toHaveTextContent('3');
  });

  it('renders "Rule" as group column header when groupBy is rule', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} groupBy="rule" />);

    expect(screen.getAllByText('Rule').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Component" as group column header when groupBy is component', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} groupBy="component" />);

    expect(screen.getAllByText('Component').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onToggleGroup when expand button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    routerRenderer(<ConformaGroupedTable {...defaultProps} onToggleGroup={onToggle} />);

    const toggleButtons = screen.getAllByRole('button');
    await user.click(toggleButtons[0]);

    expect(onToggle).toHaveBeenCalledWith('Missing CVE scan');
  });

  it('shows detail sub-table when a group is expanded', () => {
    const expandedGroups = new Set(['Missing CVE scan']);
    routerRenderer(<ConformaGroupedTable {...defaultProps} expandedGroups={expandedGroups} />);

    expect(screen.getAllByText('api-gateway').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('auth-service').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the correct data-test attribute', () => {
    routerRenderer(<ConformaGroupedTable {...defaultProps} />);

    expect(screen.getByTestId('conforma-grouped-table')).toBeInTheDocument();
  });

  it('renders all column headers in expanded detail sub-table', () => {
    const expandedGroups = new Set(['Missing CVE scan']);
    routerRenderer(<ConformaGroupedTable {...defaultProps} expandedGroups={expandedGroups} />);

    expect(screen.getAllByText('Image').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Message').length).toBeGreaterThanOrEqual(1);
  });

  it('shows common image name and arch variant count when row has multiple images', () => {
    const groupsWithMultipleImages: GroupedConformaRow[] = [
      {
        groupKey: 'Multi-arch rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [
          createRow({
            images: [
              'quay.io/test/img@sha256:aaa',
              'quay.io/test/img@sha256:bbb',
              'quay.io/test/img@sha256:ccc',
            ],
          }),
        ],
      },
    ];
    const expandedGroups = new Set(['Multi-arch rule']);
    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithMultipleImages}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getByText('quay.io/test/img')).toBeInTheDocument();
    expect(screen.getByText('3 arch variants')).toBeInTheDocument();
  });

  it('falls back to "Affects N images" when images have different repo names', () => {
    const groupsWithDifferentImages: GroupedConformaRow[] = [
      {
        groupKey: 'Mixed images rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [
          createRow({
            images: ['quay.io/test/img-a@sha256:aaa', 'quay.io/test/img-b@sha256:bbb'],
          }),
        ],
      },
    ];
    const expandedGroups = new Set(['Mixed images rule']);
    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithDifferentImages}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getByText('Affects 2 images')).toBeInTheDocument();
  });

  it('shows truncated image when row has a single image', () => {
    const groupsWithSingleImage: GroupedConformaRow[] = [
      {
        groupKey: 'Single-image rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [createRow({ images: ['quay.io/test/img@sha256:only'] })],
      },
    ];
    const expandedGroups = new Set(['Single-image rule']);
    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithSingleImage}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.queryByText(/affects.*images/i)).not.toBeInTheDocument();
  });

  it('renders multi-image tooltip content', () => {
    const groupsWithMultipleImages: GroupedConformaRow[] = [
      {
        groupKey: 'Multi-arch rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [
          createRow({
            images: ['quay.io/test/img@sha256:aaa', 'quay.io/test/img@sha256:bbb'],
          }),
        ],
      },
    ];
    const expandedGroups = new Set(['Multi-arch rule']);
    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithMultipleImages}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getByText('quay.io/test/img')).toBeInTheDocument();
    expect(screen.getByText('2 arch variants')).toBeInTheDocument();
  });

  it('renders single collapsed image via images[0] without a tooltip', () => {
    const groupsWithSingleCollapsedImage: GroupedConformaRow[] = [
      {
        groupKey: 'Single-collapsed rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [
          createRow({
            images: ['quay.io/test/img@sha256:only'],
          }),
        ],
      },
    ];
    const expandedGroups = new Set(['Single-collapsed rule']);
    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithSingleCollapsedImage}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Affects 1 images/)).not.toBeInTheDocument();
  });

  it('shows dash when row has no image', () => {
    const groupsWithImage: GroupedConformaRow[] = [
      {
        groupKey: 'Has image rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [createRow({ images: ['quay.io/test/img@sha256:abc'] }), createRow({ images: [] })],
      },
    ];
    const expandedGroups = new Set(['Has image rule']);
    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithImage}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });

  it('renders row code in the detail sub-table when present', () => {
    const groupsWithCode: GroupedConformaRow[] = [
      {
        groupKey: 'Trusted task rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [createRow({ code: 'trusted_task.trusted' })],
      },
    ];
    const expandedGroups = new Set(['Trusted task rule']);

    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithCode}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getByText('trusted_task.trusted')).toBeInTheDocument();
  });

  it('renders empty string msg instead of falling back to dash', () => {
    const groupsWithEmptyMsg: GroupedConformaRow[] = [
      {
        groupKey: 'Empty message rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [createRow({ msg: '' })],
      },
    ];
    const expandedGroups = new Set(['Empty message rule']);

    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithEmptyMsg}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getByTestId('conforma-violation-msg')).toHaveTextContent('');
  });

  it('renders dash when row has no msg', () => {
    const groupsWithNoMsg: GroupedConformaRow[] = [
      {
        groupKey: 'No message rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [createRow({ msg: undefined })],
      },
    ];
    const expandedGroups = new Set(['No message rule']);

    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithNoMsg}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.queryByTestId('conforma-violation-msg')).not.toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });

  it('renders truncated message with expand/collapse toggle for long msg', async () => {
    const user = userEvent.setup();
    const longMsg =
      'This violation message is intentionally very long and exceeds eighty characters so that truncation kicks in and the user must click more to read the rest';
    const groupsWithLongMsg: GroupedConformaRow[] = [
      {
        groupKey: 'Long message rule',
        violations: 1,
        warnings: 0,
        successes: 0,
        rows: [createRow({ msg: longMsg })],
      },
    ];
    const expandedGroups = new Set(['Long message rule']);

    routerRenderer(
      <ConformaGroupedTable
        {...defaultProps}
        groups={groupsWithLongMsg}
        expandedGroups={expandedGroups}
      />,
    );

    expect(screen.getByText(`${longMsg.slice(0, 80)}...`)).toBeInTheDocument();
    const moreButton = screen.getByRole('button', { name: 'more' });
    expect(moreButton).toBeInTheDocument();

    await user.click(moreButton);

    expect(screen.getByText(longMsg)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'less' })).toBeInTheDocument();
  });
});
