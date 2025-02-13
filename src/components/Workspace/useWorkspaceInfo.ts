import { useContext } from 'react';
// remove eslint disable once migration to namespace is done
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { useNamespace } from '../../shared/providers/Namespace';
import { WorkspaceContext } from './workspace-context';

/**
 * @deprecated Migrate to Namespaces
 * use {@link useNamespace}
 *
 */
export const useWorkspaceInfo = () => useContext(WorkspaceContext);
