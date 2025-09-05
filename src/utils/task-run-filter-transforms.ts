import { PipelineRunLabel } from '~/consts/pipelinerun';
import { MatchExpression, Selector, WatchK8sResource } from '~/types/k8s';

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
 * Converts a TaskRunSelector (Tekton-style filter object) into a format
 * suitable for KubeArchive resource queries.
 *
 * Specifically:
 * - Converts `filterByName` into a Kubernetes field selector string (`metadata.name=...`).
 * - Converts `filterByCommit` into a label-based matchExpression.
 * - Preserves any existing `matchLabels` and `matchExpressions`.
 * - Returns an object containing:
 *   - `selector`: a Selector object with labels and expressions for KubeArchive.
 *   - `fieldSelector`: a pre-built string suitable for K8s API field selectors.
 *
 * Notes:
 * - `filterByCreationTimestampAfter` cannot be expressed as a K8s fieldSelector
 *   (Kubernetes does not support comparison operators in field selectors). This
 *   filter must be applied client-side.
 *
 * @param filterBy - TaskRunSelector object containing Tekton-style filter options.
 * @returns An object with `selector` and `fieldSelector` ready for use with KubeArchive hooks.
 */
export const convertFilterToKubearchiveSelectors = (
  filterBy: TaskRunSelector,
): Pick<WatchK8sResource, 'fieldSelector' | 'selector'> => {
  const fieldSelectors: Record<string, string> = {};
  if (filterBy.filterByName) fieldSelectors['metadata.name'] = filterBy.filterByName;

  const fieldSelector = Object.keys(fieldSelectors).length
    ? Object.entries(fieldSelectors)
        .map(([k, v]) => `${k}=${v}`)
        .join(',')
    : undefined;

  // Build matchExpressions (including commit filter)
  const matchExpressions: MatchExpression[] = [
    ...(filterBy.matchExpressions ?? []),
    ...(filterBy.filterByCommit
      ? [
          {
            key: PipelineRunLabel.COMMIT_LABEL,
            operator: 'Equals',
            values: [filterBy.filterByCommit],
          },
        ]
      : []),
  ];

  // Build the final selector (excluding custom filter fields)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { filterByName, filterByCreationTimestampAfter, filterByCommit, ...rest } = filterBy;
  const selector: Selector = { ...rest, matchLabels: filterBy.matchLabels, matchExpressions };

  return { selector, fieldSelector };
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
  if (!selector) return { namespace };

  const { selector: kubearchiveSelector, fieldSelector } =
    convertFilterToKubearchiveSelectors(selector);

  return {
    namespace,
    selector: kubearchiveSelector,
    fieldSelector,
  };
};
