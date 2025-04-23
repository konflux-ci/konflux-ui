import { render, screen } from '@testing-library/react';
import { getShortcutPopover } from '../utils';

describe('getShortcutPopover', () => {
  it('should return PopoverProps with correct aria-label', () => {
    const result = getShortcutPopover();

    expect(result['aria-label']).toBe('Shortcuts');
  });

  it('should return PopoverProps with correct maxWidth', () => {
    const result = getShortcutPopover();

    expect(result.maxWidth).toBe('25rem');
  });

  it('should return PopoverProps with correct distance', () => {
    const result = getShortcutPopover();

    expect(result.distance).toBe(18);
  });

  it('should include onHide callback when provided', () => {
    const mockOnHide = jest.fn();
    const result = getShortcutPopover(mockOnHide);

    expect(result.onHide).toBe(mockOnHide);
  });

  it('should not include onHide callback when not provided', () => {
    const result = getShortcutPopover();

    expect(result.onHide).toBeUndefined();
  });

  it('should render bodyContent with CodeEditorShortcut components', () => {
    const result = getShortcutPopover();
    const { container } = render(<>{result.bodyContent}</>);

    // check for F1 shortcut
    const f1Button = container.querySelector('[data-test-id="F1-button"]');
    expect(f1Button).toBeInTheDocument();
    expect(screen.getByText('F1')).toBeInTheDocument();

    // check for hover shortcut
    const hoverCommand = container.querySelector('[data-test-id="hover"]');
    expect(hoverCommand).toBeInTheDocument();
    expect(screen.getByText('Hover')).toBeInTheDocument();

    // check for shortcut descriptions
    expect(screen.getByText('View all editor shortcuts')).toBeInTheDocument();
    expect(screen.getByText('View property descriptions')).toBeInTheDocument();
  });

  it('should render both shortcuts in the bodyContent', () => {
    const result = getShortcutPopover();
    const { container } = render(<>{result.bodyContent}</>);

    // verify both shortcuts are rendered
    const shortcuts = container.querySelectorAll('.code-editor-shortcut__cell');
    expect(shortcuts.length).toBeGreaterThan(0);

    // verify F1 shortcut is present
    expect(container.querySelector('[data-test-id="F1-button"]')).toBeInTheDocument();

    // verify hover shortcut is present
    expect(container.querySelector('[data-test-id="hover"]')).toBeInTheDocument();
  });
});
