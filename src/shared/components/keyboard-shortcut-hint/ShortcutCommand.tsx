import * as React from 'react';
import './KeyboardShortcutHint.scss';

interface ShortcutCommandProps {
  keys: string; // e.g. "Shift+?" or "PageUp" or "Fn+ArrowUp"
}

export const ShortcutCommand: React.FC<ShortcutCommandProps> = ({ keys }) => {
  const segments = keys.split('+').map((s) => s.trim());
  return (
    <span className="keyboard-shortcut__command">
      {segments.map((segment, index) => (
        <React.Fragment key={`${index}-${segment}`}>
          {index > 0 && <span className="keyboard-shortcut__separator">+</span>}
          <kbd className="keyboard-shortcut__key">{segment}</kbd>
        </React.Fragment>
      ))}
    </span>
  );
};
