import React from 'react';
import { Language } from '@patternfly/react-code-editor';
import { render, screen } from '@testing-library/react';
import { CodeEditor } from '../CodeEditor';

const mockUseShortcutPopover = jest.fn();
const mockShortcutPopover = { 'aria-label': 'Shortcuts' };

jest.mock('../hooks/useShortcutPopover', () => ({
  useShortcutPopover: (...args: unknown[]) => mockUseShortcutPopover(...args),
}));

let capturedProps: Record<string, unknown> = {};

jest.mock('@patternfly/react-code-editor', () => ({
  CodeEditor: (props: Record<string, unknown>) => {
    capturedProps = props;
    React.useEffect(() => {
      const onEditorDidMount = props.onEditorDidMount as
        | ((editor: unknown, monaco: unknown) => void)
        | undefined;
      onEditorDidMount?.({}, {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <pre data-test="mock-editor">{props.code as string}</pre>;
  },
  Language: { yaml: 'yaml', json: 'json' },
  EditorDidMount: jest.fn(),
}));

describe('CodeEditor', () => {
  const mockOnEditorDidMount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = {};
    mockUseShortcutPopover.mockReturnValue(mockShortcutPopover);
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

    expect(mockUseShortcutPopover).toHaveBeenCalled();
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
});
