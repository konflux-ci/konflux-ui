import { render, screen } from '@testing-library/react';
import { CodeViewer } from '../CodeViewer';

jest.mock('react-syntax-highlighter', () => ({
  PrismLight: Object.assign(
    ({ children, language, ...props }: { children: string; language: string }) => (
      <pre data-test="syntax-highlighter" data-language={language} {...props}>
        {children}
      </pre>
    ),
    {
      registerLanguage: jest.fn(),
    },
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/languages/prism/yaml', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

describe('CodeViewer', () => {
  it('should render the viewer with the correct code', () => {
    const code = 'application: test-app';
    render(<CodeViewer code={code} />);

    const viewerContent = screen.getByTestId('syntax-highlighter');
    expect(viewerContent).toHaveTextContent(code);
  });

  it('should use yaml as default language', () => {
    render(<CodeViewer code="application: test-app" />);

    const viewer = screen.getByTestId('syntax-highlighter');
    expect(viewer).toHaveAttribute('data-language', 'yaml');
  });

  it('should respect custom language prop', () => {
    render(<CodeViewer code="{}" language="json" />);

    const viewer = screen.getByTestId('syntax-highlighter');
    expect(viewer).toHaveAttribute('data-language', 'json');
  });
});
