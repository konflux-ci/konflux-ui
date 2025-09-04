import { PipelineRunLabel } from '~/consts/pipelinerun';
import { MatchLabels, MatchExpression, Selector } from '~/types/k8s';

/**
 * Transform utilities for converting between Tekton Results filters and Kubearchive selectors
 */

export interface KubearchiveTaskRunFilters {
  matchLabels?: MatchLabels;
  matchExpressions?: MatchExpression[];
  fieldSelectors?: Record<string, string>;
}

/**
 * Extended selector type that includes typed filter fields for TaskRuns
 */
export type TaskRunSelector = Selector &
  Partial<{
    filterByName: string;
    filterByCreationTimestampAfter: string;
    filterByCommit: string;
  }>;

/**
 * Converts filterBy options to Kubearchive label/field selectors
 */
export const convertFilterToKubearchiveSelectors = (
  filterBy: TaskRunSelector,
): KubearchiveTaskRunFilters => {
  const result: KubearchiveTaskRunFilters = {};

  // Handle field selectors - convert custom filters to Kubernetes field selectors
  const fieldSelectors: Record<string, string> = {};

  if (filterBy.filterByName) {
    fieldSelectors['metadata.name'] = filterBy.filterByName;
  }

  if (filterBy.filterByCreationTimestampAfter) {
    fieldSelectors['metadata.creationTimestamp'] = `>${filterBy.filterByCreationTimestampAfter}`;
  }

  if (Object.keys(fieldSelectors).length > 0) {
    result.fieldSelectors = fieldSelectors;
  }

  // Handle label selectors
  if (filterBy.matchLabels) {
    result.matchLabels = filterBy.matchLabels;
  }

  if (filterBy.matchExpressions) {
    result.matchExpressions = filterBy.matchExpressions;
  }

  // Handle commit filter as match expression
  if (filterBy.filterByCommit) {
    // Use only the primary SHA label; OR across keys isn't supported by Kubernetes selectors.
    const sha = filterBy.filterByCommit;
    const expr: MatchExpression = {
      key: PipelineRunLabel.COMMIT_LABEL,
      operator: 'In',
      values: [sha],
    };
    result.matchExpressions = [...(result.matchExpressions ?? []), expr];
  }

  return result;
};

/**
 * Converts Kubearchive selectors back to filterBy format for compatibility
 */
export const convertKubearchiveSelectorsToFilter = (
  selectors: KubearchiveTaskRunFilters,
): Partial<{
  filterByName: string;
  filterByCreationTimestampAfter: string;
  matchLabels: MatchLabels;
  matchExpressions: MatchExpression[];
}> => {
  const result: Partial<{
    filterByName: string;
    filterByCreationTimestampAfter: string;
    matchLabels: MatchLabels;
    matchExpressions: MatchExpression[];
  }> = {};

  // Handle field selectors
  if (selectors.fieldSelectors) {
    if (selectors.fieldSelectors['metadata.name']) {
      result.filterByName = selectors.fieldSelectors['metadata.name'];
    }

    if (selectors.fieldSelectors['metadata.creationTimestamp']) {
      const timestamp = selectors.fieldSelectors['metadata.creationTimestamp'];
      if (timestamp.startsWith('>')) {
        result.filterByCreationTimestampAfter = timestamp.substring(1);
      }
    }
  }

  // Handle label selectors
  if (selectors.matchLabels) {
    result.matchLabels = selectors.matchLabels;
  }

  if (selectors.matchExpressions) {
    result.matchExpressions = selectors.matchExpressions;
  }

  return result;
};

/**
 * Creates a Kubearchive-compatible selector from a TaskRunSelector object
 */
export const createKubearchiveSelector = (selector?: TaskRunSelector): Selector | undefined => {
  if (!selector) return undefined;

  const kubearchiveFilters = convertFilterToKubearchiveSelectors(selector);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { filterByName, filterByCreationTimestampAfter, filterByCommit, ...rest } = selector;

  return {
    ...rest,
    matchLabels: kubearchiveFilters.matchLabels,
    matchExpressions: kubearchiveFilters.matchExpressions,
  };
};

/**
 * Creates a Kubearchive WatchK8sResource with field selectors
 */
export const createKubearchiveWatchResource = (
  namespace: string,
  selector?: TaskRunSelector,
): {
  namespace: string;
  selector?: Selector;
  fieldSelector?: string;
} => {
  if (!selector) {
    return { namespace };
  }

  const kubearchiveFilters = convertFilterToKubearchiveSelectors(selector);
  const kubearchiveSelector = createKubearchiveSelector(selector);

  // Build field selector string
  let fieldSelector: string | undefined;
  if (kubearchiveFilters.fieldSelectors) {
    const fieldPairs = Object.entries(kubearchiveFilters.fieldSelectors).map(
      ([key, value]) => `${key}=${value}`,
    );
    fieldSelector = fieldPairs.join(',');
  }

  return {
    namespace,
    selector: kubearchiveSelector,
    fieldSelector,
  };
};
