import React, { useMemo } from 'react';
import { loader } from '@monaco-editor/react';
import {
  CodeEditor as PatternFlyCodeEditor,
  Language,
  EditorDidMount,
  CodeEditorProps,
} from '@patternfly/react-code-editor';
import { Flex, FlexItem } from '@patternfly/react-core';
import * as monacoConfig from 'monaco-editor/esm/vs/editor/editor.api';
import { getShortcutPopover } from './utils';

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
  height,
  showShortcuts,
  language,
  onEditorDidMount,
}) => {
  const finalHeight = height ?? '500px';
  const finalShowShortcuts = showShortcuts ?? true;
  const finalLanguage = language ?? Language.yaml;

  const shortcutPopover = useMemo(() => getShortcutPopover(), []);

  return (
    <Flex flex={{ default: 'flex_1' }}>
      <FlexItem flex={{ default: 'flex_1' }}>
        <PatternFlyCodeEditor
          language={finalLanguage}
          code={code}
          options={{
            readOnly: true,
          }}
          onEditorDidMount={onEditorDidMount}
          isDarkTheme
          height={finalHeight}
          shortcutsPopoverProps={finalShowShortcuts ? shortcutPopover : undefined}
        />
      </FlexItem>
    </Flex>
  );
};
