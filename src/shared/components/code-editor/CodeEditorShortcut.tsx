import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { MouseIcon } from '@patternfly/react-icons/dist/esm/icons/mouse-icon';
import { upperFirst } from 'lodash-es';

import './CodeEditorShortcut.scss';

interface CodeEditorShortcutProps {
  children: React.ReactNode;
  hover?: boolean;
  keyName?: string;
}

export const ShortcutCommand = ({ children }: { children: React.ReactNode }) => (
  <span className="code-editor-shortcut__command">
    <kbd className="code-editor-shortcut__kbd">{children}</kbd>
  </span>
);

const CodeEditorShortcut: React.FC<CodeEditorShortcutProps> = ({ children, hover, keyName }) => {
  return (
    <Grid>
      <GridItem span={4} className="code-editor-shortcut__cell">
        {hover && (
          <ShortcutCommand data-test-id="hover">
            <MouseIcon /> Hover
          </ShortcutCommand>
        )}
        {keyName && (
          <ShortcutCommand data-test-id={`${keyName}-button`}>
            {keyName.length === 1 ? keyName.toUpperCase() : upperFirst(keyName.toLowerCase())}
          </ShortcutCommand>
        )}
      </GridItem>
      <GridItem span={8} className="code-editor-shortcut__cell">
        {children}
      </GridItem>
    </Grid>
  );
};

export default CodeEditorShortcut;
