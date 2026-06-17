import { CONTEXT_TARGET_ATTR } from '~/consts/ai-chat-context';
import { findContextTargetAtPoint } from '../context/utils';

describe('findContextTargetAtPoint', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('returns the innermost context target under the pointer', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="outer" data-ai-chat-context-label="Outer" style="width: 400px; height: 300px; padding: 20px;">
        <div data-ai-chat-context="true" data-ai-chat-context-id="inner" data-ai-chat-context-label="Inner" style="width: 120px; height: 40px;">
          <span id="leaf">Row text</span>
        </div>
      </div>
    `;

    const leaf = document.getElementById('leaf');
    const inner = document.querySelector<HTMLElement>('[data-ai-chat-context-id="inner"]');
    const outer = document.querySelector<HTMLElement>('[data-ai-chat-context-id="outer"]');

    expect(leaf).not.toBeNull();
    expect(inner).not.toBeNull();
    expect(outer).not.toBeNull();
    if (!leaf || !inner || !outer) {
      return;
    }

    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [leaf, inner, outer],
    });

    const target = findContextTargetAtPoint(10, 10, leaf);

    expect(target?.getAttribute(CONTEXT_TARGET_ATTR)).toBe('true');
    expect(target?.getAttribute('data-ai-chat-context-id')).toBe('inner');
  });

  it('ignores page context targets behind the chat dock UI', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="table-row" data-ai-chat-context-label="Table row">
        <span id="row-cell">Row text</span>
      </div>
      <div class="konflux-ai-chat__dock">
        <button id="done-btn" type="button">Done</button>
      </div>
    `;

    const doneButton = document.getElementById('done-btn');
    const rowCell = document.getElementById('row-cell');
    const rowTarget = document.querySelector<HTMLElement>('[data-ai-chat-context-id="table-row"]');

    expect(doneButton).not.toBeNull();
    expect(rowCell).not.toBeNull();
    expect(rowTarget).not.toBeNull();
    if (!doneButton || !rowCell || !rowTarget) {
      return;
    }

    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [doneButton, rowCell, rowTarget],
    });

    expect(findContextTargetAtPoint(10, 10, doneButton)).toBeNull();
  });
});
