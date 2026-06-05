import { Table, Tbody } from '@patternfly/react-table';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';
import { GroupHeader } from '~/shared/components/TableV2';

const meta: Meta<typeof GroupHeader> = {
  title: 'TableV2/GroupHeader',
  component: GroupHeader,
  decorators: [
    (Story) => (
      <Table aria-label="Test">
        <Tbody>
          <Story />
        </Tbody>
      </Table>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof GroupHeader>;

export const CollapsedGroup: Story = {
  args: {
    groupId: 'apps',
    groupName: 'Applications',
    rowCount: 5,
    visibleColumnCount: 4,
    isExpanded: false,
    onToggle: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Applications (5)')).toBeInTheDocument();
    const button = canvas.getByRole('button');
    await expect(button).toBeInTheDocument();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  },
};

export const ExpandedGroup: Story = {
  args: {
    groupId: 'services',
    groupName: 'Services',
    rowCount: 12,
    visibleColumnCount: 6,
    isExpanded: true,
    onToggle: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Services (12)')).toBeInTheDocument();
    const button = canvas.getByRole('button');
    await expect(button).toBeInTheDocument();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  },
};
