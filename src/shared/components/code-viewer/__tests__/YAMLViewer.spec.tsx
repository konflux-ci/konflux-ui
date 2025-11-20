import { render, screen } from '@testing-library/react';
import { YAMLViewer } from '../YAMLViewer';

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

describe('YAMLViewer', () => {
  it('should render the YAMLViewer and parse code into YAML string', () => {
    const code = { application: 'test-app' };
    render(<YAMLViewer code={code} />);

    const editor = screen.getByTestId('syntax-highlighter');
    expect(editor).toHaveTextContent('application: test-app');
    expect(editor).toHaveAttribute('data-language', 'yaml');
  });

  it('should handle empty code gracefully', () => {
    render(<YAMLViewer code={undefined} />);

    const editor = screen.getByTestId('syntax-highlighter');
    expect(editor).toHaveTextContent('{}');
  });

  it('should handle null code gracefully', () => {
    render(<YAMLViewer code={null} />);

    const editor = screen.getByTestId('syntax-highlighter');
    expect(editor).toHaveTextContent('{}');
  });
});
