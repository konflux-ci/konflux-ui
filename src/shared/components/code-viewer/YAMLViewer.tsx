import React from 'react';
import { stringify as yamlStringify } from 'yaml';
import { CodeViewer, type Props as CodeViewerProps } from './CodeViewer';

type Props = Omit<CodeViewerProps, 'code' | 'language'> & {
  code: Record<string, unknown> | undefined;
};

export const YAMLViewer: React.FC<Props> = ({ code, ...props }) => {
  return <CodeViewer {...props} language="yaml" code={yamlStringify(code ?? {})} />;
};
