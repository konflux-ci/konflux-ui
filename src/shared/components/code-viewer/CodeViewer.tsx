import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export type Props = {
  code: string;
  language?: string;
  height?: string;
  showShortcuts?: boolean;
};

export const CodeViewer: React.FC<Props> = ({ code, language = 'yaml' }) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        borderRadius: 0,
      }}
      showLineNumbers
      wrapLines
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  );
};
