import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import {
  getLightspeedClient,
  updateListedConversationTopicSummary,
} from '~/lightspeed/lightspeedClient';

describe('getLightspeedClient', () => {
  it('returns the upstream Lightspeed client that renames and deletes conversations', () => {
    const client = getLightspeedClient();

    expect(client).toBeInstanceOf(LightspeedClient);
    expect(client.constructor).toBe(LightspeedClient);
    expect(getLightspeedClient()).toBe(client);
  });
});

describe('updateListedConversationTopicSummary', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('updates the v1 conversation record the history list reads', async () => {
    await updateListedConversationTopicSummary('conv 1', 'Renamed chat');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost/api/plugins/lightspeed/v1/conversations/conv%201',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ['topic_summary']: 'Renamed chat' }),
      }),
    );
  });

  it('rejects with the response status when the v1 update fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    await expect(updateListedConversationTopicSummary('conv-1', 'Renamed chat')).rejects.toMatchObject({
      status: 404,
    });
  });
});
