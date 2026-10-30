import * as React from 'react';

export const useToggle = (initialState = false): readonly [boolean, () => void] => {
  const [state, setState] = React.useState(initialState);

  const toggle = React.useCallback(() => {
    setState((previousState) => !previousState);
  }, []);

  return [state, toggle];
};
