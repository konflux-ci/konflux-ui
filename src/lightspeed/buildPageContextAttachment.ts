import type { Attachment } from '@redhat-cloud-services/lightspeed-client';
import { AIChatPageContextPayload } from '~/components/AIChat/pageContext/types';

const ATTACHMENT_TYPE_KEY = 'attachment_type';
const CONTENT_TYPE_KEY = 'content_type';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readStringField = (value: Record<string, unknown>, key: string): string | undefined => {
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
};

const isAttachment = (value: unknown): value is Attachment => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    readStringField(value, 'content') !== undefined &&
    readStringField(value, CONTENT_TYPE_KEY) === 'application/json' &&
    readStringField(value, ATTACHMENT_TYPE_KEY) !== undefined
  );
};

/** Lightspeed QueryRequest attachment. Field names are snake_case in JSON. */
export const buildPageContextAttachment = (context: AIChatPageContextPayload): Attachment => {
  const attachment: Record<string, unknown> = {
    content: JSON.stringify(context),
    [CONTENT_TYPE_KEY]: 'application/json',
    [ATTACHMENT_TYPE_KEY]: 'api object',
  };

  if (!isAttachment(attachment)) {
    throw new Error('Failed to build Konflux AI page context attachment');
  }

  return attachment;
};
