import { CONTEXT_SELECTED_CLASS } from '~/consts/ai-chat-context';
import {
  clearAllContextHighlightsInDocument,
  syncSelectedHighlights,
} from '../context/highlight';

describe('context highlight sync', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('syncSelectedHighlights applies highlight to matching context ids', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="row-a" data-test="row-a">A</div>
      <div data-ai-chat-context="true" data-ai-chat-context-id="row-b" data-test="row-b">B</div>
    `;

    syncSelectedHighlights(new Set(['row-a']));

    expect(document.querySelector('[data-test="row-a"]')).toHaveClass(CONTEXT_SELECTED_CLASS);
    expect(document.querySelector('[data-test="row-b"]')).not.toHaveClass(CONTEXT_SELECTED_CLASS);
  });

  it('syncSelectedHighlights re-applies highlight after virtualized remount', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="row-a" data-test="row-a">A</div>
    `;

    syncSelectedHighlights(new Set(['row-a']));
    const original = document.querySelector('[data-test="row-a"]');
    expect(original).toHaveClass(CONTEXT_SELECTED_CLASS);

    document.body.innerHTML = `
      <div data-ai-chat-context="true" data-ai-chat-context-id="row-a" data-test="row-a">A remounted</div>
    `;

    const remounted = document.querySelector('[data-test="row-a"]');
    expect(remounted).not.toHaveClass(CONTEXT_SELECTED_CLASS);

    syncSelectedHighlights(new Set(['row-a']));
    expect(remounted).toHaveClass(CONTEXT_SELECTED_CLASS);
  });

  it('clearAllContextHighlightsInDocument removes all selected highlights', () => {
    document.body.innerHTML = `
      <div class="${CONTEXT_SELECTED_CLASS}" data-test="selected">Selected</div>
    `;

    clearAllContextHighlightsInDocument();

    expect(document.querySelector('[data-test="selected"]')).not.toHaveClass(CONTEXT_SELECTED_CLASS);
  });
});
