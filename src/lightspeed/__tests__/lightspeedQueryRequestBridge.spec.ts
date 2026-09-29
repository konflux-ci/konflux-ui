import {
  isLightspeedQueryRequest,
  mergePendingFieldsIntoQueryBody,
  setPendingQueryRequestFields,
} from '~/lightspeed/lightspeedQueryRequestBridge';

describe('lightspeedQueryRequestBridge', () => {
  beforeEach(() => {
    setPendingQueryRequestFields(undefined);
  });

  it('should return the body when nothing is pending', () => {
    const body = JSON.stringify({ query: 'hello' });
    expect(mergePendingFieldsIntoQueryBody(body)).toBe(body);
  });

  it('should merge pending fields into the next query body only', () => {
    setPendingQueryRequestFields({ attachments: [{ content: '{}' }] });

    expect(JSON.parse(mergePendingFieldsIntoQueryBody(JSON.stringify({ query: 'hello' })))).toEqual(
      {
        query: 'hello',
        attachments: [{ content: '{}' }],
      },
    );
    expect(mergePendingFieldsIntoQueryBody(JSON.stringify({ query: 'next' }))).toBe(
      JSON.stringify({ query: 'next' }),
    );
  });

  it('should ignore a non-object body and still consume the pending fields', () => {
    setPendingQueryRequestFields({ attachments: [] });

    expect(mergePendingFieldsIntoQueryBody('[]')).toBe('[]');
    expect(mergePendingFieldsIntoQueryBody(JSON.stringify({ query: 'next' }))).toBe(
      JSON.stringify({ query: 'next' }),
    );
  });

  it('should match Lightspeed query posts only', () => {
    expect(
      isLightspeedQueryRequest('https://example.test/api/plugins/lightspeed/v1/streaming_query', {
        method: 'POST',
      }),
    ).toBe(true);
    expect(
      isLightspeedQueryRequest('https://example.test/api/plugins/lightspeed/v1/query', {
        method: 'POST',
      }),
    ).toBe(true);
    expect(
      isLightspeedQueryRequest('https://example.test/api/plugins/lightspeed/v1/streaming_query'),
    ).toBe(false);
    expect(
      isLightspeedQueryRequest('https://example.test/api/plugins/lightspeed/readiness', {
        method: 'POST',
      }),
    ).toBe(false);
  });
});
