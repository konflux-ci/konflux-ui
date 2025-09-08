import { act, render, screen } from '@testing-library/react';
import HelpPopover from '../index';

const mockedBodyContent =
  'Select an option that allow you to link your desired components in this namespace while creating the secrets.';

describe('HelpPopover', () => {
  it('should apply make-popover-visible-inside-modal style if HelpPopover is inside a Modal', async () => {
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      return await render(
        <div className="pf-c-modal-box">
          <HelpPopover bodyContent={mockedBodyContent} isVisible />
        </div>,
      );
    });

    screen.getByText(
      'Select an option that allow you to link your desired components in this namespace while creating the secrets.',
    );
    expect(screen.getByTestId('help-popover')).toHaveClass('make-popover-visible-inside-modal');
  });

  it('should NOT apply make-popover-visible-inside-modal style if HelpPopover is NOT inside a Modal', async () => {
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      return await render(<HelpPopover bodyContent={mockedBodyContent} isVisible />);
    });

    screen.getByText(
      'Select an option that allow you to link your desired components in this namespace while creating the secrets.',
    );
    expect(screen.getByTestId('help-popover')).not.toHaveClass('make-popover-visible-inside-modal');
  });
});
