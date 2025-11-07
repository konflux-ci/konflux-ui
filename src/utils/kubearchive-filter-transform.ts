import { MatchExpression, Selector, WatchK8sResource } from '~/types/k8s';

export type KubearchiveFilterTransformSelector = Selector &
  Partial<{
    filterByName: string;
    filterByCreationTimestampAfter: string;
    filterByCommit: string;
  }>;

export const convertFilterToKubearchiveSelectors = (
  filterBy: KubearchiveFilterTransformSelector,
): Pick<WatchK8sResource, 'fieldSelector' | 'selector'> => {
  const fieldSelectors: Record<string, string> = {};

  // Apply name filtering via field selector
  if (filterBy.filterByName) {
    // e.g. name=*e2e*
    // Matches resources whose names contain "e2e" anywhere
    fieldSelectors.name = `*${filterBy.filterByName}*`;
  }

  // Apply creation timestamp filtering via field selector
  if (filterBy.filterByCreationTimestampAfter) {
    // e.g. creationTimestampAfter=2023-01-01T12:00:00Z
    fieldSelectors.creationTimestampAfter = filterBy.filterByCreationTimestampAfter;
  }

  const fieldSelector = Object.keys(fieldSelectors).length
    ? Object.entries(fieldSelectors)
        .map(([k, v]) => `${k}=${v}`)
        .join(',')
    : undefined;

  const matchExpressions: MatchExpression[] = [...(filterBy.matchExpressions ?? [])];

  // Build the final selector (excluding custom filter fields)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { filterByName, filterByCreationTimestampAfter, filterByCommit, ...rest } = filterBy;
  const selector: Selector = {
    ...rest,
    matchLabels: filterBy.matchLabels,
    matchExpressions: matchExpressions.length ? matchExpressions : undefined,
  }; // matchExpressions is optional only include if it has any expressions and to maintain tanstack query stable hash

  return { selector, fieldSelector };
};

/**
 * Creates a Kubearchive WatchK8sResource with field selectors
 */
export const createKubearchiveWatchResource = (
  namespace: string,
  selector?: KubearchiveFilterTransformSelector,
): {
  namespace: string;
  selector?: Selector;
  fieldSelector?: string;
} => {
  if (!selector) return { namespace };

  const { selector: kubearchiveSelector, fieldSelector } =
    convertFilterToKubearchiveSelectors(selector);

  return {
    namespace,
    selector: kubearchiveSelector,
    fieldSelector,
  };
};
