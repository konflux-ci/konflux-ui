/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getNamespaceUsingWorspaceFromQueryCache = async (
  workspace: string,
): Promise<string | undefined> => {
  return Promise.resolve(workspace);
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
export const getWorkspaceUsingNamespaceFromQueryCache = async (
  namespace: string,
): Promise<string | undefined> => {
  return Promise.resolve(namespace);
};

/**
 * @deprecated in favor of [Namespace](../../shared/providers/Namespace/utils.ts)
 */
