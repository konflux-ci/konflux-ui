import { renderHook } from '@testing-library/react';
import { TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID } from '@redhat-cloud-services/lightspeed-client';
import { useAIChatActiveConversationId } from '~/components/AIChat/hooks/useAIChatActiveConversationId';

const mockUseActiveConversation = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useActiveConversation: () => mockUseActiveConversation(),
}));

describe('useAIChatActiveConversationId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    undefined,
    { id: '' },
    { id: '__temp_conversation__' },
    { id: LIGHTSPEED_TEMP_CONVERSATION_ID },
  ])('hides a temporary active conversation (%j)', (activeConversation) => {
    mockUseActiveConversation.mockReturnValue(activeConversation);

    const { result } = renderHook(() => useAIChatActiveConversationId());

    expect(result.current).toBeNull();
  });

  it('exposes a saved active conversation id', () => {
    mockUseActiveConversation.mockReturnValue({ id: 'older' });

    const { result } = renderHook(() => useAIChatActiveConversationId());

    expect(result.current).toBe('older');
  });
});
