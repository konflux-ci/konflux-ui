import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatRenameConversationModal } from '~/components/AIChat/components/AIChatRenameConversationModal';

describe('AIChatRenameConversationModal', () => {
  const appendTo = () => document.body;
  const onClose = jest.fn();
  const onRename = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renames with the trimmed name', async () => {
    const user = userEvent.setup();
    render(
      <AIChatRenameConversationModal
        appendTo={appendTo}
        currentName="Pipeline failure"
        isOpen
        onClose={onClose}
        onRename={onRename}
      />,
    );

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(nameInput);
    await user.type(nameInput, '  Renamed chat  ');
    await user.click(screen.getByRole('button', { name: 'Rename' }));

    expect(onRename).toHaveBeenCalledWith('Renamed chat');
  });

  it('does not rename again while a rename is in progress', () => {
    render(
      <AIChatRenameConversationModal
        appendTo={appendTo}
        currentName="Pipeline failure"
        isOpen
        isSubmitting
        onClose={onClose}
        onRename={onRename}
      />,
    );

    expect(screen.getByRole('button', { name: /Rename/ })).toBeDisabled();
    expect(onRename).not.toHaveBeenCalled();
  });
});
