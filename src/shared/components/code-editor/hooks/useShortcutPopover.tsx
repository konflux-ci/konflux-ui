import { PopoverProps } from '@patternfly/react-core';
import { Tbody, Table } from '@patternfly/react-table';
import CodeEditorShortcut from '../CodeEditorShortcut';

export const useShortcutPopover = (onHideShortcuts?: () => void): PopoverProps => ({
  'aria-label': 'Shortcuts',
  bodyContent: (
    <Table>
      <Tbody>
        <CodeEditorShortcut keyName="F1">View all editor shortcuts</CodeEditorShortcut>
        <CodeEditorShortcut hover>View property descriptions</CodeEditorShortcut>
      </Tbody>
    </Table>
  ),
  maxWidth: '25rem',
  distance: 18,
  onHide: onHideShortcuts,
});
