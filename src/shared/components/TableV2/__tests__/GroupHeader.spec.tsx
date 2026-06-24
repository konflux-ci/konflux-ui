import { Table, Tbody } from '@patternfly/react-table';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { GroupHeader } from '~/shared/components/TableV2';

const renderGroupHeader = (props: Partial<React.ComponentProps<typeof GroupHeader>> = {}) =>
  render(
    <Table aria-label="test">
      <Tbody>
        <GroupHeader
          groupId="team-alpha"
          groupName="Team Alpha"
          rowCount={5}
          visibleColumnCount={4}
          isExpanded={true}
          onToggle={jest.fn()}
          groupIndex={0}
          {...props}
        />
      </Tbody>
    </Table>,
  );

describe('GroupHeader', () => {
  it('renders the group name', () => {
    renderGroupHeader({ groupName: 'Team Alpha' });
    expect(screen.getByText(/Team Alpha/)).toBeInTheDocument();
  });

  it('renders the row count', () => {
    renderGroupHeader({ rowCount: 5 });
    expect(screen.getByText(/\(5\)/)).toBeInTheDocument();
  });

  it('sets the data-test attribute with groupId', () => {
    renderGroupHeader({ groupId: 'team-alpha' });
    expect(screen.getByTestId('group-header-team-alpha')).toBeInTheDocument();
  });

  it('spans remaining columns after the toggle cell', () => {
    renderGroupHeader({ visibleColumnCount: 6 });
    const row = screen.getByTestId('group-header-team-alpha');
    const cells = within(row).getAllByRole('cell');
    // toggle cell + content cell = 2
    expect(cells).toHaveLength(2);
    // content cell spans visibleColumnCount - 1 (toggle takes 1)
    expect(cells[1]).toHaveAttribute('colspan', '5');
  });

  it('calls onToggle when the toggle button is clicked', async () => {
    const onToggle = jest.fn();
    renderGroupHeader({ onToggle });

    const row = screen.getByTestId('group-header-team-alpha');
    const button = within(row).getByRole('button');
    await userEvent.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('reflects expanded state', () => {
    const { rerender } = renderGroupHeader({ isExpanded: true });

    const expandedButton = within(screen.getByTestId('group-header-team-alpha')).getByRole(
      'button',
    );
    expect(expandedButton).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <Table aria-label="test">
        <Tbody>
          <GroupHeader
            groupId="team-alpha"
            groupName="Team Alpha"
            rowCount={5}
            visibleColumnCount={4}
            isExpanded={false}
            onToggle={jest.fn()}
            groupIndex={0}
          />
        </Tbody>
      </Table>,
    );

    const collapsedButton = within(screen.getByTestId('group-header-team-alpha')).getByRole(
      'button',
    );
    expect(collapsedButton).toHaveAttribute('aria-expanded', 'false');
  });
});
