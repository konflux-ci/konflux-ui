// remove eslint disable once migration to namespace is done

import * as React from 'react';
import { NamespaceContext } from '../../shared/providers/Namespace/namespace-context';

/**
 * @deprecated Migrate to Namespaces
 *
 */
export const useWorkspaceInfo = () => {
  /**
   * [TODO]
   * used NamespaceContext instead of useNamespace to avoid circular dependency in unit tests
   * Will be removed once useWorkspaceInfo hook is removed
   */
  const namespace = React.useContext(NamespaceContext).namespace;
  return { workspace: namespace, namespace };
};
