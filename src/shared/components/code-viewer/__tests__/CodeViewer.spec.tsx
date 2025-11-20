import { render, screen } from '@testing-library/react';
import { CodeViewer } from '../CodeViewer';

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language, ...props }: { children: string; language: string }) => (
    <pre data-test="syntax-highlighter" data-language={language} {...props}>
      {children}
    </pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

describe('CodeViewer', () => {
  it('should render the editor with the correct code', () => {
    const code = 'application: test-app';
    render(<CodeViewer code={code} />);

    const editorContent = screen.getByTestId('syntax-highlighter');
    expect(editorContent).toHaveTextContent(code);
  });

  it('should trigger onEditorDidMount when the editor is mounted', () => {
    render(<CodeViewer code="application: test-app" />);
  });

  it('should use yaml as default language', () => {
    render(<CodeViewer code="application: test-app" />);

    const editor = screen.getByTestId('syntax-highlighter');
    expect(editor).toHaveAttribute('data-language', 'yaml');
  });

  it('should respect custom language prop', () => {
    render(<CodeViewer code="{}" language="json" />);

    const editor = screen.getByTestId('syntax-highlighter');
    expect(editor).toHaveAttribute('data-language', 'json');
  });
});
