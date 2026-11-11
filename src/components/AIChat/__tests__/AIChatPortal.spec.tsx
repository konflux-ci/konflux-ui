import { render, screen } from '@testing-library/react';
import { AIChatPortal } from '~/components/AIChat/AIChatPortal';

const getChatLandmark = () => screen.getByRole('complementary', { name: 'AI Chat' });

describe('AIChatPortal', () => {
  it('renders children into a landmark on document.body, outside the app root', () => {
    const { container } = render(
      <div data-test="app-root">
        <AIChatPortal>
          <p>Hello from chat</p>
        </AIChatPortal>
      </div>,
    );

    const landmark = getChatLandmark();

    expect(landmark.parentElement).toBe(document.body);
    expect(screen.getByTestId('app-root')).not.toContainElement(landmark);
    expect(container).not.toContainElement(landmark);
    expect(landmark).toHaveTextContent('Hello from chat');
  });

  it('removes the portal landmark and its children when unmounted', () => {
    const { unmount } = render(
      <AIChatPortal>
        <p>Hello from chat</p>
      </AIChatPortal>,
    );

    expect(getChatLandmark()).toBeInTheDocument();

    unmount();

    expect(screen.queryByRole('complementary', { name: 'AI Chat' })).not.toBeInTheDocument();
    expect(screen.queryByText('Hello from chat')).not.toBeInTheDocument();
  });

  it('leaves unrelated document.body nodes in place when unmounted', () => {
    const existing = document.createElement('div');
    existing.id = 'existing-body-node';
    document.body.appendChild(existing);

    const { unmount } = render(
      <AIChatPortal>
        <p>Hello from chat</p>
      </AIChatPortal>,
    );

    try {
      unmount();
      expect(document.body.contains(existing)).toBe(true);
    } finally {
      existing.remove();
    }
  });
});
