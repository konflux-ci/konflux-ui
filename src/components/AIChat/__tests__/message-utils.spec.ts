import type { Message } from '@redhat-cloud-services/ai-client-state';
import {
  KONFLUX_AI_ERROR_MESSAGE_TOO_LONG,
  KONFLUX_AI_ERROR_NOT_FOUND,
  KONFLUX_AI_ERROR_PERMISSION,
  KONFLUX_AI_ERROR_QUOTA,
  KONFLUX_AI_ERROR_UNAVAILABLE,
} from '~/components/AIChat/const';
import {
  getUserFacingErrorMessage,
  stateMessagesToMessageProps,
} from '~/components/AIChat/message-utils';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';

const createMessage = (overrides: Partial<Message> & Pick<Message, 'id' | 'role'>): Message => ({
  answer: '',
  date: new Date('2026-01-15T12:00:00.000Z'),
  ...overrides,
});

describe('getUserFacingErrorMessage', () => {
  it.each([
    [401, KONFLUX_AI_ERROR_PERMISSION],
    [403, KONFLUX_AI_ERROR_PERMISSION],
    [404, KONFLUX_AI_ERROR_NOT_FOUND],
    [413, KONFLUX_AI_ERROR_MESSAGE_TOO_LONG],
    [429, KONFLUX_AI_ERROR_QUOTA],
    [503, KONFLUX_AI_ERROR_UNAVAILABLE],
  ] as const)('maps HTTP %s to a user-facing message', (status, expected) => {
    expect(getUserFacingErrorMessage(status)).toBe(expected);
  });

  it('maps unknown and zero statuses to the unavailable message', () => {
    expect(getUserFacingErrorMessage(0)).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    expect(getUserFacingErrorMessage(500)).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
  });
});

describe('stateMessagesToMessageProps', () => {
  it('maps user and bot messages to PatternFly Message props', () => {
    const messages = [
      createMessage({ id: 'u1', role: 'user', answer: 'Hello' }),
      createMessage({ id: 'b1', role: 'bot', answer: 'Hi there' }),
    ];

    const result = stateMessagesToMessageProps(messages, false);

    expect(result).toEqual([
      {
        id: 'u1',
        role: 'user',
        alignment: 'end',
        content: 'Hello',
        name: 'You',
        timestamp: messages[0].date.toLocaleString(),
      },
      {
        id: 'b1',
        role: 'bot',
        alignment: 'start',
        content: 'Hi there',
        name: LIGHTSPEED_ASSISTANT_NAME,
        timestamp: messages[1].date.toLocaleString(),
      },
    ]);
  });

  it('uses a custom assistant name when provided', () => {
    const messages = [createMessage({ id: 'b1', role: 'bot', answer: 'Answer' })];

    const [botMessage] = stateMessagesToMessageProps(messages, false, 'Custom Bot');

    expect(botMessage.name).toBe('Custom Bot');
  });

  it('marks the last empty bot message as loading while a response is in progress', () => {
    const messages = [
      createMessage({ id: 'u1', role: 'user', answer: 'Question' }),
      createMessage({ id: 'b1', role: 'bot', answer: '   ' }),
    ];

    const result = stateMessagesToMessageProps(messages, true);

    expect(result[1]).toMatchObject({
      id: 'b1',
      isLoading: true,
      content: '   ',
    });
    expect(result[0]).not.toHaveProperty('isLoading');
  });

  it('does not mark a bot message as loading when it already has content', () => {
    const messages = [createMessage({ id: 'b1', role: 'bot', answer: 'Partial answer' })];

    const [botMessage] = stateMessagesToMessageProps(messages, true);

    expect(botMessage).not.toHaveProperty('isLoading');
  });

  it('does not mark a user message as loading', () => {
    const messages = [createMessage({ id: 'u1', role: 'user', answer: '' })];

    const [userMessage] = stateMessagesToMessageProps(messages, true);

    expect(userMessage).not.toHaveProperty('isLoading');
  });

  it('does not mark an empty bot message as loading when not in progress', () => {
    const messages = [createMessage({ id: 'b1', role: 'bot', answer: '' })];

    const [botMessage] = stateMessagesToMessageProps(messages, false);

    expect(botMessage).not.toHaveProperty('isLoading');
  });
});
