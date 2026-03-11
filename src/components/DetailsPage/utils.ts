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
  onClick: () => {
    if (typeof action.cta === 'function') void action.cta();
  },
});
