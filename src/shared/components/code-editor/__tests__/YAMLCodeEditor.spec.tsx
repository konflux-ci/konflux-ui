import React from 'react';
import type { Monaco } from '@monaco-editor/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { mockedSwaggerDefinitions } from '../__data__/mock-data';
import { useSwaggerDefinitions } from '../hooks/useSwaggerDefinitions';
import { registerYAMLinMonaco } from '../monaco';
import { YAMLCodeEditor } from '../YAMLCodeEditor';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(() => jest.fn()),
  };
});

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

  describe('error state handling', () => {
    it('should display error state when useSwaggerDefinitions returns an error', () => {
      const errorObject = new Error('Something went wrong');
      (useSwaggerDefinitions as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: errorObject,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <YAMLCodeEditor code={{ application: 'test-app' }} />
        </QueryClientProvider>,
      );

      expect(screen.getByText('Unable to load yaml code editor')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-editor')).not.toBeInTheDocument();
      expect(registerYAMLinMonaco).not.toHaveBeenCalled();
    });

    it('should display error state with 404 error code', () => {
      const error404 = { code: 404 };
      (useSwaggerDefinitions as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: error404,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <YAMLCodeEditor code={{ application: 'test-app' }} />
        </QueryClientProvider>,
      );

      // 404 errors show NotFoundEmptyState instead
      expect(screen.getByText('404: Page not found')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-editor')).not.toBeInTheDocument();
      expect(registerYAMLinMonaco).not.toHaveBeenCalled();
    });

    it('should not display error state when loading', () => {
      const errorWithCode = { code: 500, message: 'Internal Server Error' };
      (useSwaggerDefinitions as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: errorWithCode,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <YAMLCodeEditor code={{ application: 'test-app' }} />
        </QueryClientProvider>,
      );

      // Should show loading spinner, not error state
      expect(screen.getByRole('progressbar')).toBeVisible();
      expect(screen.queryByText('Unable to load yaml code editor')).not.toBeInTheDocument();
    });

    it('should not display error state when there is no error', () => {
      (useSwaggerDefinitions as jest.Mock).mockReturnValue({
        data: mockedSwaggerDefinitions,
        isLoading: false,
        error: null,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <YAMLCodeEditor code={{ application: 'test-app' }} />
        </QueryClientProvider>,
      );

      expect(screen.queryByText('Unable to load yaml code editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    });
  });
});
