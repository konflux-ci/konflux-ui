import { MatchExpression, Selector, WatchK8sResource } from '~/types/k8s';

export type PipelineRunSelector = Selector &
  Partial<{
    filterByName: string;
    filterByCreationTimestampAfter: string;
    filterByCommit: string;
  }>;

export const convertFilterToKubearchiveSelectors = (
  filterBy: PipelineRunSelector,
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

  // Build the final selector (excluding custom filter fields that are handled separately)
  const selector: Selector = { ...filterBy, matchLabels: filterBy.matchLabels, matchExpressions };

  return { selector, fieldSelector };
};

/**
 * Creates a Kubearchive WatchK8sResource with field selectors for PipelineRuns
 */
export const createKubearchiveWatchResource = (
  namespace: string,
  selector?: PipelineRunSelector,
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
