import { PopoverProps } from '@patternfly/react-core';
import CodeEditorShortcut from '../CodeEditorShortcut';

export const useShortcutPopover = (onHideShortcuts?: () => void): PopoverProps => ({
  'aria-label': 'Shortcuts',
  bodyContent: (
    <div>
      <CodeEditorShortcut keyName="F1">View all editor shortcuts</CodeEditorShortcut>
      <CodeEditorShortcut hover>View property descriptions</CodeEditorShortcut>
    </div>
  ),
  maxWidth: '25rem',
  distance: 18,
  onHide: onHideShortcuts,
});
