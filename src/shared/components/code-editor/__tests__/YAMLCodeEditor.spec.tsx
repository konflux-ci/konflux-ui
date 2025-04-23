import React from 'react';
import type { Monaco } from '@monaco-editor/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { mockedSwaggerDefinitions } from '../__data__/mock-data';
import { useSwaggerDefinitions } from '../hooks/useSwaggerDefinitions';
import { registerYAMLinMonaco } from '../monaco';
import { YAMLCodeEditor } from '../YAMLCodeEditor';

const mockMonaco: Monaco = {
  languages: {
    getLanguages: () => [{ id: 'yaml' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

jest.mock('@monaco-editor/react', () => ({
  loader: {
    config: jest.fn(),
    init: jest.fn().mockResolvedValue({}),
  },
  default: (props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      props.onMount?.({}, mockMonaco);
    }, [props]);
    return <div data-test="monaco-editor">{props.value}</div>;
  },
}));

jest.mock('../hooks/useSwaggerDefinitions', () => ({
  useSwaggerDefinitions: jest.fn(),
}));

jest.mock('../monaco', () => ({
  registerYAMLinMonaco: jest.fn(),
}));

jest.mock('@patternfly/react-code-editor', () => ({
  CodeEditor: (props) => {
    React.useEffect(() => {
      props.onEditorDidMount?.({}, mockMonaco);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <pre data-test="mock-editor">{props.code}</pre>;
  },
  Language: { yaml: 'yaml', json: 'json' },
  EditorDidMount: jest.fn(),
}));

const queryClient = new QueryClient();

describe('YAMLCodeEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSwaggerDefinitions as jest.Mock).mockReturnValue({
      data: mockedSwaggerDefinitions,
      isLoading: false,
    });
  });

  it('should render the YAMLCodeEditor and parse code into YAML string', () => {
    const code = { application: 'test-app' };
    render(
      <QueryClientProvider client={queryClient}>
        <YAMLCodeEditor code={code} />
      </QueryClientProvider>,
    );

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveTextContent('application: test-app');
  });

  it('should show loading spinner when definitions are loading', () => {
    (useSwaggerDefinitions as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <YAMLCodeEditor code={undefined} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should register YAML schema with Monaco', async () => {
    const code = { application: 'test-app' };

    render(
      <QueryClientProvider client={queryClient}>
        <YAMLCodeEditor code={code} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(registerYAMLinMonaco).toHaveBeenCalled();
    });
  });

  it('should handle empty code gracefully', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <YAMLCodeEditor code={undefined} />
      </QueryClientProvider>,
    );

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveTextContent('{}');
  });

  it('should handle swagger definitions fetch error gracefully', () => {
    (useSwaggerDefinitions as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <YAMLCodeEditor code={{ application: 'test-app' }} />
      </QueryClientProvider>,
    );

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toBeInTheDocument();
    expect(registerYAMLinMonaco).not.toHaveBeenCalled();
  });
});
