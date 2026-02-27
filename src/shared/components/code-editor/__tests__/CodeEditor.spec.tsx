import React from 'react';
import { Language } from '@patternfly/react-code-editor';
import { render, screen } from '@testing-library/react';
import { CodeEditor } from '../CodeEditor';

const mockGetShortcutPopover = jest.fn();
const mockShortcutPopover = { 'aria-label': 'Shortcuts' };

jest.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  // Providing a minimal mock object to satisfy the shape expected by loader.config
  editor: {},
  languages: {},
}));

jest.mock('@monaco-editor/react', () => {
  const original = jest.requireActual('@monaco-editor/react');
  return {
    ...original,
    loader: {
      config: jest.fn(),
    },
  };
});

jest.mock('../utils', () => ({
  getShortcutPopover: (...args: unknown[]) => mockGetShortcutPopover(...args),
}));

let capturedProps: Record<string, unknown> = {};

// The mock needs to be defined BEFORE the import of CodeEditor
jest.mock('@patternfly/react-code-editor', () => {
  const original = jest.requireActual('@patternfly/react-code-editor');

  const MockPatternFlyCodeEditor = (props) => {
    // Capture props to assert against them later
    capturedProps = props;

    // Immediately run onEditorDidMount to satisfy test requirements
    React.useEffect(() => {
      props.onEditorDidMount?.({}, {});
    }, [props, props.onEditorDidMount]);

    // Render a simple element for testing content
    return <pre data-test="mock-editor">{props.code}</pre>;
  };
  MockPatternFlyCodeEditor.displayName = 'PatternFlyCodeEditor';

  return {
    ...original, // Keep Language and other exports
    CodeEditor: MockPatternFlyCodeEditor,
    EditorDidMount: original.EditorDidMount,
  };
});

describe('CodeEditor', () => {
  const mockOnEditorDidMount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = {};
    mockGetShortcutPopover.mockReturnValue(mockShortcutPopover);
  });

  it('should render the editor with the correct code', () => {
    const code = 'application: test-app';
    render(<CodeEditor code={code} onEditorDidMount={mockOnEditorDidMount} />);

    const editorContent = screen.getByTestId('mock-editor');
    expect(editorContent).toHaveTextContent(code);
  });

  it('should trigger onEditorDidMount when the editor is mounted', () => {
    render(<CodeEditor code="application: test-app" onEditorDidMount={mockOnEditorDidMount} />);

    expect(mockOnEditorDidMount).toHaveBeenCalled();
  });

  it('should use default prop values when not provided', () => {
    render(<CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} />);

    expect(capturedProps.language).toBe(Language.yaml);
    expect(capturedProps.height).toBe('500px');
    expect(capturedProps.shortcutsPopoverProps).toBe(mockShortcutPopover);
    expect(capturedProps.isDarkTheme).toBe(true);
    expect(capturedProps.options).toEqual({ readOnly: true });
  });

  it('should pass custom height prop to PatternFlyCodeEditor', () => {
    render(<CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} height="300px" />);

    expect(capturedProps.height).toBe('300px');
  });

  it('should pass custom language prop to PatternFlyCodeEditor', () => {
    render(
      <CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} language={Language.json} />,
    );

    expect(capturedProps.language).toBe(Language.json);
  });

  it('should pass shortcutsPopoverProps when showShortcuts is true (default)', () => {
    render(<CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} />);

    expect(mockGetShortcutPopover).toHaveBeenCalled();
    expect(capturedProps.shortcutsPopoverProps).toBe(mockShortcutPopover);
  });

  it('should not pass shortcutsPopoverProps when showShortcuts is false', () => {
    render(
      <CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} showShortcuts={false} />,
    );

    expect(capturedProps.shortcutsPopoverProps).toBeUndefined();
  });

  it('should pass all required props to PatternFlyCodeEditor', () => {
    const code = 'application: test-app';
    render(<CodeEditor code={code} onEditorDidMount={mockOnEditorDidMount} />);

    expect(capturedProps.code).toBe(code);
    expect(capturedProps.language).toBe(Language.yaml);
    expect(capturedProps.height).toBe('500px');
    expect(capturedProps.onEditorDidMount).toBe(mockOnEditorDidMount);
    expect(capturedProps.isDarkTheme).toBe(true);
    expect(capturedProps.options).toEqual({ readOnly: true });
  });

  it('should render Flex and FlexItem structure', () => {
    const { container } = render(
      <CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} />,
    );

    expect(container.querySelector('.pf-v5-l-flex')).toBeInTheDocument();
    const flexElement = container.querySelector('.pf-v5-l-flex');
    expect(flexElement).toBeInTheDocument();
    expect(flexElement?.children.length).toBeGreaterThan(0);
  });

  it('should handle all props together', () => {
    const code = 'test: value';
    render(
      <CodeEditor
        code={code}
        onEditorDidMount={mockOnEditorDidMount}
        height="400px"
        language={Language.json}
        showShortcuts={true}
      />,
    );

    expect(capturedProps.code).toBe(code);
    expect(capturedProps.height).toBe('400px');
    expect(capturedProps.language).toBe(Language.json);
    expect(capturedProps.shortcutsPopoverProps).toBe(mockShortcutPopover);
    expect(capturedProps.isDarkTheme).toBe(true);
  });

  it('should render with showShortcuts explicitly set to true', () => {
    render(<CodeEditor code="test" onEditorDidMount={mockOnEditorDidMount} showShortcuts={true} />);

    expect(capturedProps.shortcutsPopoverProps).toBe(mockShortcutPopover);
  });
});
