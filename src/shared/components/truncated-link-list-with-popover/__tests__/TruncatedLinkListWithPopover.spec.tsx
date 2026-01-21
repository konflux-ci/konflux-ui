import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TruncatedLinkListWithPopover from '../TruncatedLinkListWithPopover';

describe('TruncatedLinkListWithPopover', () => {
  const popoverConfig = {
    header: 'More items',
    ariaLabel: 'More items',
    moreText: (count: number) => `${count} more`,
    dataTestIdPrefix: 'more-items-popover',
  };

  it('renders "-" when items are empty', () => {
    render(
      <TruncatedLinkListWithPopover
        items={[]}
        popover={popoverConfig}
        renderItem={(item) => <span key={item}>{item}</span>}
      />,
    );

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('shows first 3 items and reveals hidden items in popover', async () => {
    const user = userEvent.setup();
    const items = ['one', 'two', 'three', 'four', 'five'];

    render(
      <TruncatedLinkListWithPopover
        items={items}
        popover={popoverConfig}
        renderItem={(item) => <span key={item}>{item}</span>}
      />,
    );

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
    expect(screen.queryByText('four')).not.toBeInTheDocument();
    expect(screen.queryByText('five')).not.toBeInTheDocument();

    const moreButton = screen.getByText('2 more');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText('four')).toBeInTheDocument();
      expect(screen.getByText('five')).toBeInTheDocument();
    });
  });
});
