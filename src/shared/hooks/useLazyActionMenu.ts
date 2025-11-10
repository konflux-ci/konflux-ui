import * as React from 'react';

type UseLazyActionMenuParams<TAction> = {
  buildActions: (context?: unknown) => TAction[];
  loadContext?: () => Promise<unknown>;
};

export type LazyActionHookResult<TAction> = [actions: TAction[], onOpen: (isOpen: boolean) => void];

export const useLazyActionMenu = <TAction>({
  buildActions,
  loadContext,
}: UseLazyActionMenuParams<TAction>): LazyActionHookResult<TAction> => {
  const hasLazyLoading = !!loadContext;
  const [opened, setOpened] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [context, setContext] = React.useState<unknown | null>(null);

  const onOpen = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return;
      setOpened(true);

      // Skip lazy loading if no loadContext provided
      if (!hasLazyLoading) return;

      if (context || loading) return;
      setLoading(true);
      void loadContext()
        .then((ctx) => setContext(ctx))
        .finally(() => setLoading(false));
    },
    [context, loading, loadContext, hasLazyLoading],
  );

  const actions = React.useMemo(() => {
    const built = buildActions(hasLazyLoading ? context : undefined);

    // Only show loading state if lazy loading is enabled
    if (hasLazyLoading && (!opened || loading)) {
      return built.map((a) => ({
        ...a,
        disabled: true,
        disabledTooltip: 'Checking permissions...',
      }));
    }
    return built;
  }, [opened, loading, buildActions, hasLazyLoading, context]);

  return [actions, onOpen] as const;
};

export function composeLazyActions<TAction>(
  ...hooks: LazyActionHookResult<TAction>[]
): LazyActionHookResult<TAction> {
  const onOpenCallbacks = hooks.map((h) => h[1]);
  const allActions = hooks.map((h) => h[0]);

  const onOpen = (isOpen: boolean) => {
    onOpenCallbacks.forEach((callback) => callback(isOpen));
  };

  const actions = allActions.flat();

  return [actions, onOpen];
}
