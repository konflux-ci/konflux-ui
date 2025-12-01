import React from 'react';
import { loader } from '@monaco-editor/react';
import {
  CodeEditor as PatternFlyCodeEditor,
  Language,
  EditorDidMount,
  CodeEditorProps,
} from '@patternfly/react-code-editor';
import * as monacoConfig from 'monaco-editor/esm/vs/editor/editor.api';
import { useShortcutPopover } from './hooks/useShortcutPopover';

loader.config({ monaco: monacoConfig });

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
  const shortcutPopover = useShortcutPopover();

  return (
    <div style={{ flexGrow: 1 }}>
      <PatternFlyCodeEditor
        language={language}
        code={code}
        options={{
          readOnly: true,
        }}
        onEditorDidMount={onEditorDidMount}
        isDarkTheme
        height={height}
        shortcutsPopoverProps={showShortcuts ? shortcutPopover : undefined}
      />
    </div>
  );
};
