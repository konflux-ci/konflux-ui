import * as React from 'react';
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';
import HelpPopover from '../HelpPopover';

const TestHelpPopover: React.FC = () => (
  <HelpPopover headerContent="Help" bodyContent="This is a help popover">
    <span>Click me</span>
  </HelpPopover>
);

describe('HelpPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render anything when inside a PF5 modal', () => {
    render(
      <div className="pf-v5-c-modal-box">
        <TestHelpPopover />
      </div>,
    );

    expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument();
  });

  it('renders the popover when not inside a modal', () => {
    render(<TestHelpPopover />);
    expect(screen.queryByRole('button', { name: /help/i })).toBeInTheDocument();

    const icon = screen.getByRole('button', { name: /help/i });
    expect(icon).toBeInTheDocument();

    fireEvent.click(icon);
    expect(screen.getByText(/this is a help popover/i)).toBeInTheDocument();
  });
});
