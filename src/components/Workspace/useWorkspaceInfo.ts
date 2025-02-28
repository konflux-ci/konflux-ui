// remove eslint disable once migration to namespace is done

import { useNamespace } from '../../shared/providers/Namespace';

/**
 * @deprecated Migrate to Namespaces
 * use {@link useNamespace}
 *
 */
export const useWorkspaceInfo = () => {
  const namespace = useNamespace();
  return { workspace: namespace, namespace };
};
