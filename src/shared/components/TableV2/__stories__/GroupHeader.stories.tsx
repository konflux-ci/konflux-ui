import { Table as PfTable, Tbody } from '@patternfly/react-table';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { GroupHeader } from '~/shared/components/TableV2';

const meta: Meta<typeof GroupHeader> = {
  title: 'TableV2/GroupHeader',
  component: GroupHeader,
  decorators: [
    (Story) => (
      <PfTable aria-label="Group header demo">
        <Tbody>
          <Story />
        </Tbody>
      </PfTable>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof GroupHeader>;

export const Collapsed: Story = {
  args: {
    groupId: 'apps',
    groupName: 'Applications',
    rowCount: 5,
    visibleColumnCount: 4,
    isExpanded: false,
    onToggle: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Group name and count visible
    await expect(canvas.getByText('Applications (5)')).toBeInTheDocument();

    // Toggle button exists with aria-expanded=false
    const button = canvas.getByRole('button');
    await expect(button).toBeInTheDocument();
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    // data-test attribute
    const row = canvasElement.querySelector('[data-test="group-header-apps"]');
    await expect(row).not.toBeNull();

    // Click fires onToggle
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
  },
};

export const Expanded: Story = {
  args: {
    groupId: 'services',
    groupName: 'Services',
    rowCount: 12,
    visibleColumnCount: 6,
    isExpanded: true,
    onToggle: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Services (12)')).toBeInTheDocument();

    const button = canvas.getByRole('button');
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    // Click fires onToggle
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
  },
};
