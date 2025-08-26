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
 * Converts filterBy options to Kubearchive label/field selectors
 */
export const convertFilterToKubearchiveSelectors = (
  filterBy: Partial<{
    filterByName: string;
    filterByCreationTimestampAfter: string;
    filterByCommit: string;
    matchLabels: MatchLabels;
    matchExpressions: MatchExpression[];
  }>,
): KubearchiveTaskRunFilters => {
  const result: KubearchiveTaskRunFilters = {};

  // Handle field selectors
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

  // Handle commit filter as match expression or label
  if (filterBy.filterByCommit) {
    const commitLabels = {
      'pipelinesascode.tekton.dev/sha': filterBy.filterByCommit,
      'tekton.dev/pipeline': filterBy.filterByCommit,
      'appstudio.openshift.io/commit': filterBy.filterByCommit,
    };

    // Convert commit filter to match expressions (OR logic)
    const commitExpressions: MatchExpression[] = Object.entries(commitLabels).map(
      ([key, value]) => ({
        key,
        operator: 'In',
        values: [value],
      }),
    );

    if (result.matchExpressions) {
      result.matchExpressions.push(...commitExpressions);
    } else {
      result.matchExpressions = commitExpressions;
    }
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
 * Creates a Kubearchive-compatible selector from a standard Selector object
 */
export const createKubearchiveSelector = (selector?: Selector): Selector | undefined => {
  if (!selector) return undefined;

  const kubearchiveFilters = convertFilterToKubearchiveSelectors(selector);

  return {
    ...selector,
    matchLabels: kubearchiveFilters.matchLabels,
    matchExpressions: kubearchiveFilters.matchExpressions,
    // Remove custom filter properties for Kubearchive
    filterByName: undefined,
    filterByCreationTimestampAfter: undefined,
    filterByCommit: undefined,
  };
};

/**
 * Creates a Kubearchive WatchK8sResource with field selectors
 */
export const createKubearchiveWatchResource = (
  namespace: string,
  selector?: Selector,
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
