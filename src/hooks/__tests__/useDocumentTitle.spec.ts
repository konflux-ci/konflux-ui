import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from '../useDocumentTitle';

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Konflux';
  });

  it('sets document title and restores default on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('My Page | Konflux'));

    expect(document.title).toBe('My Page | Konflux');

    unmount();

    expect(document.title).toBe('Konflux');
  });

  it('updates title when it changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'First | Konflux' },
    });

    rerender({ title: 'Second | Konflux' });

    expect(document.title).toBe('Second | Konflux');
  });
});
