import React from 'react';
import { loader } from '@monaco-editor/react';
import {
  CodeEditor as PatternFlyCodeEditor,
  Language,
  EditorDidMount,
  CodeEditorProps,
} from '@patternfly/react-code-editor';
import { Flex, FlexItem, type PopoverProps } from '@patternfly/react-core';
import * as monacoConfig from 'monaco-editor/esm/vs/editor/editor.api';
import {
  KeyboardShortcutHint,
  type ShortcutEntry,
} from '~/shared/components/keyboard-shortcut-hint/KeyboardShortcutHint';

import './CodeEditor.scss';

loader.config({ monaco: monacoConfig });

const CODE_EDITOR_SHORTCUTS: ShortcutEntry[] = [
  { keys: 'F1', macKeys: 'Fn+F1', description: 'View all editor shortcuts' },
  { keys: 'Hover', description: 'View property descriptions' },
];

const shortcutsPopoverProps: PopoverProps = {
  'aria-label': 'Shortcuts',
  bodyContent: <KeyboardShortcutHint shortcuts={CODE_EDITOR_SHORTCUTS} />,
  maxWidth: '25rem',
  distance: 18,
};

export type Props = {
  code: string;
  language?: Language;
  height?: CodeEditorProps['height'];
  showShortcuts?: boolean;
  onEditorDidMount: EditorDidMount;
};

export const CodeEditor: React.FC<Props> = ({
  code,
  height = '500px',
  showShortcuts = true,
  language = Language.yaml,
  onEditorDidMount,
}) => {
  return (
    <Flex flex={{ default: 'flex_1' }}>
      <FlexItem flex={{ default: 'flex_1' }}>
        <PatternFlyCodeEditor
          language={language}
          code={code}
          options={{
            readOnly: true,
          }}
          onEditorDidMount={onEditorDidMount}
          isDarkTheme
          height={height}
          shortcutsPopoverProps={showShortcuts ? shortcutsPopoverProps : undefined}
        />
      </FlexItem>
    </Flex>
  );
};
