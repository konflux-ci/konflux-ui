import React from 'react';
import type { Monaco } from '@monaco-editor/react';
import { Language } from '@patternfly/react-code-editor';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { stringify as yamlStringify } from 'yaml';
import { getErrorState } from '../../utils/error-utils';
import { CodeEditor, type Props as CodeEditorProps } from './CodeEditor';
import { useSwaggerDefinitions } from './hooks/useSwaggerDefinitions';
import { registerYAMLinMonaco } from './monaco';

type Props = Omit<CodeEditorProps, 'code' | 'onEditorDidMount'> & {
  code: Record<string, unknown> | undefined;
};

export const YAMLCodeEditor: React.FC<Props> = ({ code, ...props }) => {
  const { data: swaggerDefinitions, isLoading, error } = useSwaggerDefinitions();

  const [monacoInstance, setMonacoInstance] = React.useState<Monaco | null>(null);

  const handleEditorDidMount = (monaco: Monaco) => {
    if (!monaco) return;
    setMonacoInstance(monaco);
  };

  React.useEffect(() => {
    if (monacoInstance && swaggerDefinitions) {
      registerYAMLinMonaco(monacoInstance, swaggerDefinitions);
    }
  }, [monacoInstance, swaggerDefinitions]);

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, !isLoading, 'yaml code editor');
  }

  return (
    <CodeEditor
      {...props}
      language={Language.yaml}
      code={yamlStringify(code ?? {})}
      onEditorDidMount={(_, monaco) => handleEditorDidMount(monaco)}
    />
  );
};
