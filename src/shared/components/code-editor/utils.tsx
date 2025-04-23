import { PopoverProps } from '@patternfly/react-core';
import { CodeEditorShortcut } from './CodeEditorShortcut';

export const getShortcutPopover = (onHideShortcuts?: () => void): PopoverProps => ({
  'aria-label': 'Shortcuts',
  bodyContent: (
    <>
      <CodeEditorShortcut keyName="F1">View all editor shortcuts</CodeEditorShortcut>
      <CodeEditorShortcut hover>View property descriptions</CodeEditorShortcut>
    </>
  ),
  maxWidth: '25rem',
  distance: 18,
  onHide: onHideShortcuts,
});
