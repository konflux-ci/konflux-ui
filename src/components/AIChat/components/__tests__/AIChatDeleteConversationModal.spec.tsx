import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatDeleteConversationModal } from '~/components/AIChat/components/AIChatDeleteConversationModal';

describe('AIChatDeleteConversationModal', () => {
  const appendTo = () => document.body;
  const onClose = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes only after confirmation', async () => {
    const user = userEvent.setup();
    render(
      <AIChatDeleteConversationModal
        appendTo={appendTo}
        currentName="Pipeline failure"
        isOpen
        onClose={onClose}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Pipeline failure')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cancels without deleting', async () => {
    const user = userEvent.setup();
    render(
      <AIChatDeleteConversationModal
        appendTo={appendTo}
        currentName="Pipeline failure"
        isOpen
        onClose={onClose}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('does not delete again while a delete is in progress', () => {
    render(
      <AIChatDeleteConversationModal
        appendTo={appendTo}
        currentName="Pipeline failure"
        isOpen
        isSubmitting
        onClose={onClose}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
