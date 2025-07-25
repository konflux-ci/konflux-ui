import React from 'react';
import { render, screen } from '@testing-library/react';
import { CodeEditor } from '../CodeEditor';

jest.mock('../hooks/useShortcutPopover', () => ({
  useShortcutPopover: jest.fn().mockReturnValue('mocked-shortcut-popover'),
}));

jest.mock('@patternfly/react-code-editor', () => ({
  CodeEditor: (props) => {
    React.useEffect(() => {
      props.onEditorDidMount?.({}, {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <pre data-test="mock-editor">{props.code}</pre>;
  },
  Language: { yaml: 'yaml', json: 'json' },
  EditorDidMount: jest.fn(),
}));

describe('CodeEditor', () => {
  const mockOnEditorDidMount = jest.fn();

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

  it('should respect the showShortcuts prop', () => {
    render(
      <CodeEditor
        code="application: test-app"
        onEditorDidMount={mockOnEditorDidMount}
        showShortcuts={false}
      />,
    );

    expect(screen.queryByText('mocked-shortcut-popover')).toBeNull();
  });
});
