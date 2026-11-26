import { render, screen } from '@testing-library/react';
import { Portal } from '~/shared/components/Portal/Portal';

describe('Portal', () => {
  it('renders children on document.body, outside the app root', () => {
    const { container } = render(
      <div data-test="app-root">
        <Portal>
          <p>Portaled content</p>
        </Portal>
      </div>,
    );

    const content = screen.getByText('Portaled content');

    expect(content.parentElement).toBe(document.body);
    expect(screen.getByTestId('app-root')).not.toContainElement(content);
    expect(container).not.toContainElement(content);
  });

  it('renders children into a custom container', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    try {
      render(
        <Portal container={target}>
          <p>Custom container</p>
        </Portal>,
      );

      expect(target).toHaveTextContent('Custom container');
      expect(screen.getByText('Custom container').parentElement).toBe(target);
    } finally {
      target.remove();
    }
  });

  it('removes portaled children when unmounted', () => {
    const { unmount } = render(
      <Portal>
        <p>Portaled content</p>
      </Portal>,
    );

    expect(screen.getByText('Portaled content')).toBeInTheDocument();

    unmount();

    expect(screen.queryByText('Portaled content')).not.toBeInTheDocument();
  });

  it('leaves unrelated document.body nodes in place when unmounted', () => {
    const existing = document.createElement('div');
    existing.id = 'existing-body-node';
    document.body.appendChild(existing);

    const { unmount } = render(
      <Portal>
        <p>Portaled content</p>
      </Portal>,
    );

    try {
      unmount();
      expect(document.body.contains(existing)).toBe(true);
    } finally {
      existing.remove();
    }
  });
});
