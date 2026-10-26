import type { RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

/** Keyboard shortcut that moves focus to the toolbar's search bar. */
export const SEARCH_SHORTCUT_KEY = '/';

interface UseSearchShortcutParams {
  inputRef: RefObject<HTMLInputElement>;
  enabled?: boolean;
}

/**
 * Focuses the given search input when `/` is pressed, following the convention used by
 * GitHub, Slack and others. react-hotkeys-hook ignores events originating from form fields
 * and contenteditable elements by default, so typing `/` while an input is focused is
 * unaffected. `useKey` matches on `event.key` rather than `event.code`, which keeps the
 * shortcut correct on non-US keyboard layouts.
 */
export const useSearchShortcut = ({ inputRef, enabled = true }: UseSearchShortcutParams): void => {
  useHotkeys(
    SEARCH_SHORTCUT_KEY,
    (event) => {
      // Keeps the `/` character out of the input (and out of Firefox's quick find).
      event.preventDefault();
      inputRef.current?.focus();
    },
    { useKey: true, enabled },
  );
};
