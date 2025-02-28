// remove eslint disable once migration to namespace is done
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
