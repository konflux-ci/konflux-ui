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

type ShortcutCommandProps = React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>;

export const ShortcutCommand: React.FC<ShortcutCommandProps> = ({ children, ...spanProps }) => (
  <span className="code-editor-shortcut__command" {...spanProps}>
    <kbd className="code-editor-shortcut__kbd">{children}</kbd>
  </span>
);

const HoverCommand: React.FC = () => (
  <ShortcutCommand data-test-id="hover">
    <MouseIcon /> Hover
  </ShortcutCommand>
);

const KeyNameCommand: React.FC<{ keyName: string }> = ({ keyName }) => {
  const displayText =
    keyName.length === 1 ? keyName.toUpperCase() : upperFirst(keyName.toLowerCase());
  return <ShortcutCommand data-test-id={`${keyName}-button`}>{displayText}</ShortcutCommand>;
};

export const CodeEditorShortcut: React.FC<CodeEditorShortcutProps> = ({
  children,
  hover,
  keyName,
}) => {
  return (
    <Grid>
      <GridItem span={4} className="code-editor-shortcut__cell">
        {hover && <HoverCommand />}
        {keyName && <KeyNameCommand keyName={keyName} />}
      </GridItem>
      <GridItem span={8} className="code-editor-shortcut__cell">
        {children}
      </GridItem>
    </Grid>
  );
};
