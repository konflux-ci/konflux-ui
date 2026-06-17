import { CONTEXT_ID_ATTR, CONTEXT_LABEL_ATTR, CONTEXT_TARGET_ATTR } from '~/consts/ai-chat-context';
import { buildContextTargetProps, withChatContextRowProps } from '~/utils/ai-chat-context';

describe('ai-chat-context utils', () => {
  it('buildContextTargetProps returns data attributes', () => {
    const props = buildContextTargetProps({
      id: 'my/table id',
      label: 'My label',
      description: 'My description',
      parentContextId: 'parent/table',
    });

    expect(props[CONTEXT_TARGET_ATTR]).toBe('true');
    expect(props[CONTEXT_ID_ATTR]).toBe('my-table-id');
    expect(props[CONTEXT_LABEL_ATTR]).toBe('My label');
    expect(props['data-ai-chat-context-description']).toBe('My description');
    expect(props['data-ai-chat-context-parent-id']).toBe('parent-table');
  });

  it('withChatContextRowProps merges row props with context attrs', () => {
    const props = withChatContextRowProps(
      { id: 'row-1', className: 'custom-row' },
      {
        id: 'row-context-1',
        label: 'Row label',
      },
    );

    expect(props.id).toBe('row-1');
    expect(props.className).toContain('ai-chat-context-target');
    expect(props[CONTEXT_ID_ATTR]).toBe('row-context-1');
    expect(props[CONTEXT_LABEL_ATTR]).toBe('Row label');
  });
});
