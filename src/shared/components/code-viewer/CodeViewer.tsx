import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('yaml', yaml);

export type Props = {
  code: string;
  language?: string;
};

const isFirefox = navigator?.userAgent?.includes('Firefox') ?? false;

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
      PreTag={
        // fix for firefox: when copying text with line numbers, Firefox adds double newlines
        // between each line. This handler normalizes the copied text by removing the extra newline
        isFirefox
          ? ({ children, ...props }) => (
              <pre
                {...props}
                onCopy={(e) => {
                  const text = window.getSelection()?.toString().replace(/\n\n/g, '\n') || '';
                  if (text) {
                    e.clipboardData.setData('text/plain', text);
                    e.preventDefault();
                  }
                }}
              >
                {children}
              </pre>
            )
          : undefined
      }
    >
      {code}
    </SyntaxHighlighter>
  );
};
