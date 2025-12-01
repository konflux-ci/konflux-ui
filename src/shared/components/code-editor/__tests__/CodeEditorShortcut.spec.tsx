import { render, screen } from '@testing-library/react';
import { CodeEditorShortcut, ShortcutCommand } from '../CodeEditorShortcut';

describe('ShortcutCommand', () => {
  it('should render children inside kbd element', () => {
    render(<ShortcutCommand>Test Key</ShortcutCommand>);

    const kbd = screen.getByText('Test Key');
    expect(kbd.tagName).toBe('KBD');
    expect(kbd).toHaveClass('code-editor-shortcut__kbd');
  });

  it('should pass through additional props to span', () => {
    const { container } = render(
      <ShortcutCommand data-test-id="test-command" className="custom-class">
        Test
      </ShortcutCommand>,
    );

    const span = container.querySelector('[data-test-id="test-command"]');
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass('custom-class');
  });

  it('should have default class when no className prop is provided', () => {
    const { container } = render(
      <ShortcutCommand data-test-id="test-command">Test</ShortcutCommand>,
    );

    const span = container.querySelector('[data-test-id="test-command"]');
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass('code-editor-shortcut__command');
  });
});

describe('CodeEditorShortcut', () => {
  it('should render children', () => {
    render(<CodeEditorShortcut>Test description</CodeEditorShortcut>);

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render hover shortcut when hover prop is true', () => {
    const { container } = render(
      <CodeEditorShortcut hover>View property descriptions</CodeEditorShortcut>,
    );

    const hoverCommand = container.querySelector('[data-test-id="hover"]');
    expect(hoverCommand).toBeInTheDocument();
    expect(screen.getByText('Hover')).toBeInTheDocument();
  });

  it('should not render hover shortcut when hover prop is false', () => {
    const { container } = render(
      <CodeEditorShortcut hover={false}>Test description</CodeEditorShortcut>,
    );

    expect(container.querySelector('[data-test-id="hover"]')).not.toBeInTheDocument();
  });

  it('should render keyName shortcut when keyName prop is provided', () => {
    const { container } = render(
      <CodeEditorShortcut keyName="F1">View all editor shortcuts</CodeEditorShortcut>,
    );

    const keyCommand = container.querySelector('[data-test-id="F1-button"]');
    expect(keyCommand).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();
  });

  it('should format single character keyName as uppercase', () => {
    render(<CodeEditorShortcut keyName="f">Press F</CodeEditorShortcut>);

    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.queryByText('f')).not.toBeInTheDocument();
  });

  it('should format multi-character keyName with upperFirst', () => {
    render(<CodeEditorShortcut keyName="ctrl">Press Ctrl</CodeEditorShortcut>);

    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.queryByText('ctrl')).not.toBeInTheDocument();
    expect(screen.queryByText('CTRL')).not.toBeInTheDocument();
  });

  it('should handle keyName with mixed case', () => {
    render(<CodeEditorShortcut keyName="F1">Press F1</CodeEditorShortcut>);

    expect(screen.getByText('F1')).toBeInTheDocument();
  });

  it('should render both hover and keyName when both props are provided', () => {
    const { container } = render(
      <CodeEditorShortcut hover keyName="F1">
        View shortcuts
      </CodeEditorShortcut>,
    );

    expect(container.querySelector('[data-test-id="hover"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="F1-button"]')).toBeInTheDocument();
    expect(screen.getByText('Hover')).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();
  });

  it('should render only children when neither hover nor keyName are provided', () => {
    const { container } = render(<CodeEditorShortcut>Just a description</CodeEditorShortcut>);

    expect(screen.getByText('Just a description')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="hover"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id$="-button"]')).not.toBeInTheDocument();
  });

  it('should not render keyName shortcut when keyName is empty string', () => {
    const { container } = render(
      <CodeEditorShortcut keyName="">Test description</CodeEditorShortcut>,
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id$="-button"]')).not.toBeInTheDocument();
  });

  it('should handle keyName with uppercase multi-character', () => {
    render(<CodeEditorShortcut keyName="ESCAPE">Press Escape</CodeEditorShortcut>);

    expect(screen.getByText('Escape')).toBeInTheDocument();
    expect(screen.queryByText('ESCAPE')).not.toBeInTheDocument();
  });

  it('should render HoverCommand component when hover is true', () => {
    const { container } = render(<CodeEditorShortcut hover>Test</CodeEditorShortcut>);

    expect(container.querySelector('[data-test-id="hover"]')).toBeInTheDocument();
    expect(screen.getByText('Hover')).toBeInTheDocument();
  });

  it('should render KeyNameCommand component when keyName is provided', () => {
    const { container } = render(<CodeEditorShortcut keyName="Tab">Test</CodeEditorShortcut>);

    const keyCommand = container.querySelector('[data-test-id="Tab-button"]');
    expect(keyCommand).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });
});
