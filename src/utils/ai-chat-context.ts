import {
  CONTEXT_DESCRIPTION_ATTR,
  CONTEXT_ID_ATTR,
  CONTEXT_LABEL_ATTR,
  CONTEXT_PARENT_ID_ATTR,
  CONTEXT_TARGET_ATTR,
  CONTEXT_TARGET_CLASS,
} from '~/consts/ai-chat-context';

export type ChatContextTargetConfig = {
  id: string;
  label: string;
  description?: string;
  parentContextId?: string;
};

export const sanitizeContextId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');

export const buildContextTargetProps = (
  config: ChatContextTargetConfig,
): Record<string, string> => ({
  [CONTEXT_TARGET_ATTR]: 'true',
  [CONTEXT_ID_ATTR]: sanitizeContextId(config.id),
  [CONTEXT_LABEL_ATTR]: config.label,
  ...(config.description ? { [CONTEXT_DESCRIPTION_ATTR]: config.description } : {}),
  ...(config.parentContextId
    ? { [CONTEXT_PARENT_ID_ATTR]: sanitizeContextId(config.parentContextId) }
    : {}),
});

export const withChatContextRowProps = <T extends { className?: string; id?: string | number }>(
  rowProps: T,
  config: ChatContextTargetConfig,
): T & Record<string, string | number | undefined> => ({
  ...rowProps,
  ...buildContextTargetProps(config),
  className: [rowProps.className, CONTEXT_TARGET_CLASS].filter(Boolean).join(' '),
});

export const withChatContextRowPropsIfEnabled = <
  T extends { className?: string; id?: string | number },
>(
  enabled: boolean,
  rowProps: T,
  config: ChatContextTargetConfig,
): T & Record<string, string | number | undefined> =>
  enabled ? withChatContextRowProps(rowProps, config) : rowProps;
