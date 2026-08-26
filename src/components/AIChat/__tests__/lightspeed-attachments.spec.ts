import type { Attachment } from '@redhat-cloud-services/lightspeed-client';
import {
  clearPendingLightspeedAttachments,
  isLightspeedQueryUrl,
  mergeAttachmentsIntoFetchInit,
  setPendingLightspeedAttachments,
} from '~/components/AIChat/lightspeed-attachments';

const attachment: Attachment = {
  attachment_type: 'log',
  content_type: 'text/plain',
  content: 'visible log line',
};

describe('lightspeed-attachments', () => {
  afterEach(() => {
    clearPendingLightspeedAttachments();
  });

  describe('isLightspeedQueryUrl', () => {
    it('should match streaming and non-streaming query endpoints', () => {
      expect(isLightspeedQueryUrl('https://example.test/api/lightspeed/v1/streaming_query')).toBe(
        true,
      );
      expect(isLightspeedQueryUrl('https://example.test/api/lightspeed/v1/query')).toBe(true);
      expect(isLightspeedQueryUrl('https://example.test/api/lightspeed/v1/conversations')).toBe(
        false,
      );
    });
  });

  describe('mergeAttachmentsIntoFetchInit', () => {
    it('should add pending attachments to a streaming query POST body', () => {
      setPendingLightspeedAttachments([attachment]);

      const merged = mergeAttachmentsIntoFetchInit(
        'https://example.test/api/lightspeed/v1/streaming_query',
        {
          method: 'POST',
          body: JSON.stringify({ query: 'why did this fail?' }),
        },
      );

      expect(JSON.parse(String(merged?.body))).toEqual({
        query: 'why did this fail?',
        attachments: [attachment],
      });
    });

    it('should not modify requests when the user has not opted in', () => {
      const init = {
        method: 'POST',
        body: JSON.stringify({ query: 'hello' }),
      };

      expect(
        mergeAttachmentsIntoFetchInit(
          'https://example.test/api/lightspeed/v1/streaming_query',
          init,
        ),
      ).toBe(init);
    });

    it('should not modify non-query requests', () => {
      setPendingLightspeedAttachments([attachment]);
      const init = { method: 'GET' };

      expect(
        mergeAttachmentsIntoFetchInit(
          'https://example.test/api/lightspeed/v1/conversations',
          init,
        ),
      ).toBe(init);
    });
  });
});
