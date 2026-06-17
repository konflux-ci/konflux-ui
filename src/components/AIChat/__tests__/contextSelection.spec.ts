import { applyNestedContextSelectionRules } from '../context/selection';
import { ChatContextSelection } from '../context/types';

const selection = (
  id: string,
  metadata?: Record<string, string>,
): ChatContextSelection => ({
  id,
  label: id,
  route: '/test',
  ...(metadata ? { metadata } : {}),
});

describe('applyNestedContextSelectionRules', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('removes descendant selections when adding a parent', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="table" data-test="table">
        <div data-ai-chat-context="true" data-ai-chat-context-id="row-1" data-test="row-1">Row 1</div>
        <div data-ai-chat-context="true" data-ai-chat-context-id="row-2" data-test="row-2">Row 2</div>
      </div>
    `;

    const table = document.querySelector<HTMLElement>('[data-test="table"]');
    expect(table).not.toBeNull();
    if (!table) {
      return;
    }

    const previous = [selection('row-1'), selection('row-2')];
    const next = applyNestedContextSelectionRules(
      previous,
      selection('table'),
      table,
      true,
    );

    expect(next).toEqual([selection('table')]);
  });

  it('removes ancestor selections when adding a child', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="table" data-test="table">
        <div data-ai-chat-context="true" data-ai-chat-context-id="row-1" data-test="row-1">Row 1</div>
      </div>
    `;

    const row = document.querySelector<HTMLElement>('[data-test="row-1"]');
    expect(row).not.toBeNull();
    if (!row) {
      return;
    }

    const previous = [selection('table')];
    const next = applyNestedContextSelectionRules(
      previous,
      selection('row-1'),
      row,
      true,
    );

    expect(next).toEqual([selection('row-1')]);
  });

  it('removes off-screen children linked via parentContextId metadata', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="table" data-test="table"></div>
    `;

    const table = document.querySelector<HTMLElement>('[data-test="table"]');
    expect(table).not.toBeNull();
    if (!table) {
      return;
    }

    const previous = [selection('row-offscreen', { parentContextId: 'table' })];
    const next = applyNestedContextSelectionRules(
      previous,
      selection('table'),
      table,
      true,
    );

    expect(next).toEqual([selection('table')]);
  });

  it('removes only the matching selection when deselecting', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="table" data-test="table">
        <div data-ai-chat-context="true" data-ai-chat-context-id="row-1" data-test="row-1">Row 1</div>
      </div>
    `;

    const table = document.querySelector<HTMLElement>('[data-test="table"]');
    expect(table).not.toBeNull();
    if (!table) {
      return;
    }

    const previous = [selection('table'), selection('row-1')];
    const next = applyNestedContextSelectionRules(
      previous,
      selection('table'),
      table,
      false,
    );

    expect(next).toEqual([selection('row-1')]);
  });
});
