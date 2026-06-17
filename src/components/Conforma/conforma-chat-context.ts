import { UIConformaData } from '~/types/conforma';
import { ChatContextTargetConfig, sanitizeContextId } from '~/utils/ai-chat-context';

const ruleContextKey = (obj: UIConformaData): string =>
  sanitizeContextId(`${obj.component}-${obj.title}`);

export const getConformaRuleRowContext = (obj: UIConformaData): ChatContextTargetConfig => ({
  id: sanitizeContextId(`conforma-rule-${obj.component}-${obj.title}`),
  label: obj.title,
  description: `${obj.status} rule · ${obj.component}`,
  parentContextId: 'conforma-results-table',
});

export const getConformaRuleDetailContext = (obj: UIConformaData): ChatContextTargetConfig => ({
  id: sanitizeContextId(`conforma-rule-detail-${ruleContextKey(obj)}`),
  label: `${obj.title} details`,
  description: 'Expanded rule description and metadata',
});

export const getConformaRuleDescriptionContext = (obj: UIConformaData): ChatContextTargetConfig => ({
  id: sanitizeContextId(`conforma-rule-description-${ruleContextKey(obj)}`),
  label: 'Rule Description',
  description: obj.title,
});

export const getConformaRuleCollectionContext = (obj: UIConformaData): ChatContextTargetConfig => ({
  id: sanitizeContextId(`conforma-rule-collection-${ruleContextKey(obj)}`),
  label: 'Collection',
  description: obj.title,
});

export const getConformaRuleSolutionContext = (obj: UIConformaData): ChatContextTargetConfig => ({
  id: sanitizeContextId(`conforma-rule-solution-${ruleContextKey(obj)}`),
  label: 'Solution',
  description: obj.title,
});

export const getConformaRuleTimestampContext = (obj: UIConformaData): ChatContextTargetConfig => ({
  id: sanitizeContextId(`conforma-rule-timestamp-${ruleContextKey(obj)}`),
  label: 'Effective from',
  description: obj.title,
});
