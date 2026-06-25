import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { ShortcutCommand } from './ShortcutCommand';
import './KeyboardShortcutHint.scss';

export interface ShortcutEntry {
  keys: string;
  macKeys?: string;
  description: string;
}

interface KeyboardShortcutHintProps {
  shortcuts: ShortcutEntry[];
  title?: string;
  helperText?: string;
}

const isMac = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const KeyboardShortcutHint: React.FC<KeyboardShortcutHintProps> = ({
  shortcuts,
  title,
  helperText,
}) => {
  return (
    <div className="keyboard-shortcut-hint">
      {title && <div className="keyboard-shortcut-hint__title">{title}</div>}
      {shortcuts.map((shortcut) => {
        const displayKeys = isMac() && shortcut.macKeys ? shortcut.macKeys : shortcut.keys;
        return (
          <Grid key={shortcut.keys} className="keyboard-shortcut-hint__entry">
            <GridItem span={5} className="keyboard-shortcut-hint__keys">
              <ShortcutCommand keys={displayKeys} />
            </GridItem>
            <GridItem span={7} className="keyboard-shortcut-hint__description">
              {shortcut.description}
            </GridItem>
          </Grid>
        );
      })}
      {helperText && <div className="keyboard-shortcut-hint__helper-text">{helperText}</div>}
    </div>
  );
};
