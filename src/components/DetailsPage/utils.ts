import type { Action as ActionMenuAction } from '~/shared/components/action-menu/types';
import type { Action as DetailsPageAction } from './types';

/** Input shape from action-menu or helpers like downloadYamlAction (id + cta). */
type DetailsPageActionInput = {
  id: string;
  label: React.ReactNode;
  cta: (() => void) | (() => Promise<unknown>);
  key?: string;
  disabled?: boolean;
  isDisabled?: boolean;
  disabledTooltip?: React.ReactNode;
  [key: string]: unknown;
};

export const createDetailsPageAction = (action: DetailsPageActionInput): DetailsPageAction => ({
  ...action,
  key: action.key ?? action.id,
  label: action.label,
  isDisabled: action.isDisabled ?? action.disabled,
  disabledTooltip: action.disabledTooltip,
  onClick: action.cta,
});

/** Maps action-menu actions (both cta shapes) to DetailsPage actions. */
export const createDetailsPageActions = (
  actions: ActionMenuAction[],
  navigate: (path: string) => void,
): DetailsPageAction[] =>
  actions.map((action) => ({
    key: action.id,
    label: action.label,
    isDisabled: action.disabled,
    disabledTooltip: action.disabledTooltip,
    onClick: () => {
      if (action.disabled) {
        return;
      }
      if (typeof action.cta === 'function') {
        action.cta();
      } else if (!action.cta.external) {
        navigate(action.cta.href);
      }
    },
  }));
