import { render, screen } from '@testing-library/react';
import { KeyboardShortcutHint, ShortcutEntry } from '../KeyboardShortcutHint';
import { ShortcutCommand } from '../ShortcutCommand';

const sampleShortcuts: ShortcutEntry[] = [
  { keys: 'PageUp', description: 'Scroll up one page' },
  { keys: 'PageDown', description: 'Scroll down one page' },
  { keys: 'Shift+?', description: 'Show keyboard shortcuts' },
];

describe('KeyboardShortcutHint', () => {
  it('should render all provided shortcuts', () => {
    render(<KeyboardShortcutHint shortcuts={sampleShortcuts} />);
    expect(screen.getByText('Scroll up one page')).toBeInTheDocument();
    expect(screen.getByText('Scroll down one page')).toBeInTheDocument();
    expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(<KeyboardShortcutHint shortcuts={sampleShortcuts} title="Keyboard Shortcuts" />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    const { container } = render(<KeyboardShortcutHint shortcuts={sampleShortcuts} />);
    expect(container.querySelector('.keyboard-shortcut-hint__title')).toBeNull();
  });

  it('should show macKeys on Mac', () => {
    const originalNavigator = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
    });

    const shortcuts: ShortcutEntry[] = [{ keys: 'Ctrl+C', macKeys: 'Cmd+C', description: 'Copy' }];

    render(<KeyboardShortcutHint shortcuts={shortcuts} />);
    expect(screen.getByText('Cmd')).toBeInTheDocument();
    expect(screen.queryByText('Ctrl')).toBeNull();

    Object.defineProperty(navigator, 'userAgent', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('should show regular keys on non-Mac', () => {
    const originalNavigator = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });

    const shortcuts: ShortcutEntry[] = [{ keys: 'Ctrl+C', macKeys: 'Cmd+C', description: 'Copy' }];

    render(<KeyboardShortcutHint shortcuts={shortcuts} />);
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.queryByText('Cmd')).toBeNull();

    Object.defineProperty(navigator, 'userAgent', {
      value: originalNavigator,
      configurable: true,
    });
  });
});

describe('ShortcutCommand', () => {
  it('should render a single key in a kbd element', () => {
    render(<ShortcutCommand keys="PageUp" />);
    const kbd = screen.getByText('PageUp');
    expect(kbd).toBeInTheDocument();
    expect(kbd.tagName).toBe('KBD');
  });

  it('should render compound keys with separator', () => {
    render(<ShortcutCommand keys="Shift+?" />);
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();

    const kbdElements = screen.getByText('Shift').closest('.keyboard-shortcut__command');
    expect(kbdElements).toBeInTheDocument();

    const shiftKbd = screen.getByText('Shift');
    const questionKbd = screen.getByText('?');
    expect(shiftKbd.tagName).toBe('KBD');
    expect(questionKbd.tagName).toBe('KBD');
  });
});
