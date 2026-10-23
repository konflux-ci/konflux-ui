import { lightspeedFetch } from '~/lightspeed/lightspeedClient';
import {
  mergePendingFieldsIntoQueryBody,
  setPendingQueryRequestFields,
} from '~/lightspeed/lightspeedQueryRequestBridge';

describe('lightspeedFetch', () => {
  const fetchMock = jest.spyOn(global, 'fetch');

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('ok'));
    setPendingQueryRequestFields(undefined);
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('should merge pending fields into a streaming query post', async () => {
    setPendingQueryRequestFields({ attachments: [{ content: 'route' }] });

    await lightspeedFetch('https://example.test/v1/streaming_query', {
      method: 'POST',
      body: JSON.stringify({ query: 'hello' }),
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      query: 'hello',
      attachments: [{ content: 'route' }],
    });
  });

  it('should leave non-query requests unchanged', async () => {
    setPendingQueryRequestFields({ attachments: [{ content: 'route' }] });

    await lightspeedFetch('https://example.test/readiness', { method: 'GET' });

    expect(fetchMock).toHaveBeenCalledWith('https://example.test/readiness', { method: 'GET' });
    expect(JSON.parse(mergePendingFieldsIntoQueryBody(JSON.stringify({ query: 'later' })))).toEqual(
      {
        query: 'later',
        attachments: [{ content: 'route' }],
      },
    );
  });
});
