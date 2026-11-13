import { Action as ActionMenuAction } from '~/shared/components/action-menu/types';
import { createDetailsPageActions } from '../utils';

const baseAction: ActionMenuAction = {
  id: 'test-action',
  label: 'Test action',
  cta: jest.fn(),
};

describe('createDetailsPageActions', () => {
  it('maps id/label/disabled/disabledTooltip onto the DetailsPage action shape', () => {
    const [action] = createDetailsPageActions(
      [{ ...baseAction, disabled: true, disabledTooltip: 'No access' }],
      jest.fn(),
    );

    expect(action.key).toBe('test-action');
    expect(action.label).toBe('Test action');
    expect(action.isDisabled).toBe(true);
    expect(action.disabledTooltip).toBe('No access');
  });

  it('does not invoke the cta when the action is disabled', () => {
    const cta = jest.fn();
    const navigate = jest.fn();
    const [action] = createDetailsPageActions([{ ...baseAction, cta, disabled: true }], navigate);

    action.onClick?.(undefined);

    expect(cta).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('invokes a function cta directly', () => {
    const cta = jest.fn();
    const navigate = jest.fn();
    const [action] = createDetailsPageActions([{ ...baseAction, cta }], navigate);

    action.onClick?.(undefined);

    expect(cta).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates for an internal (non-external) object cta', () => {
    const navigate = jest.fn();
    const [action] = createDetailsPageActions(
      [{ ...baseAction, cta: { href: '/some/path' } }],
      navigate,
    );

    action.onClick?.(undefined);

    expect(navigate).toHaveBeenCalledWith('/some/path');
  });

  it('does not navigate for an external object cta', () => {
    const navigate = jest.fn();
    const [action] = createDetailsPageActions(
      [{ ...baseAction, cta: { href: 'https://example.com', external: true } }],
      navigate,
    );

    action.onClick?.(undefined);

    expect(navigate).not.toHaveBeenCalled();
  });
});
