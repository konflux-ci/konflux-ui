import * as React from 'react';

type UseAIChatVisibilityResult = {
  isVisible: boolean;
  toggle: () => void;
  hide: () => void;
};

/**
 * Open/close state for the AI chat panel. Invokes `onHide` when the panel closes.
 */
export const useAIChatVisibility = (onHide?: () => void): UseAIChatVisibilityResult => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isVisible) {
      onHide?.();
    }
  }, [isVisible, onHide]);

  const toggle = React.useCallback(() => {
    setIsVisible((visible) => !visible);
  }, []);

  const hide = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  return { isVisible, toggle, hide };
};
