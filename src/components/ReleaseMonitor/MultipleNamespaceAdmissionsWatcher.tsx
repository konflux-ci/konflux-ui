import * as React from 'react';
import { useK8sWatchResource } from '~/k8s';
import { ReleasePlanAdmissionGroupVersionKind, ReleasePlanAdmissionModel } from '~/models';
import { ReleasePlanAdmissionKind } from '~/types';

type WatchResult = {
  data: ReleasePlanAdmissionKind[];
  isLoading: boolean;
  error: unknown;
};

const SingleNamespaceWatcher: React.FC<{
  namespace: string;
  onUpdate: (ns: string, res: WatchResult) => void;
}> = React.memo(({ namespace, onUpdate }) => {
  const { data, isLoading, error } = useK8sWatchResource<ReleasePlanAdmissionKind[]>(
    {
      groupVersionKind: ReleasePlanAdmissionGroupVersionKind,
      namespace,
      isList: true,
    },
    ReleasePlanAdmissionModel,
  );

  React.useEffect(() => {
    onUpdate(namespace, { data: data || [], isLoading, error });
  }, [data, isLoading, error, namespace, onUpdate]);

  return null;
});

export const MultipleNamespaceAdmissionsWatcher: React.FC<{
  namespaces: string[];
  onUpdate: (data: ReleasePlanAdmissionKind[], isLoading: boolean, error: unknown) => void;
}> = ({ namespaces, onUpdate }) => {
  const [results, setResults] = React.useState<Record<string, WatchResult>>({});

  const handleUpdate = React.useCallback((ns: string, res: WatchResult) => {
    setResults((prev) => {
      const current = prev[ns];
      if (
        current &&
        current.isLoading === res.isLoading &&
        current.error === res.error &&
        current.data === res.data
      ) {
        return prev;
      }
      return { ...prev, [ns]: res };
    });
  }, []);

  React.useEffect(() => {
    if (namespaces.length === 0) {
      onUpdate([], false, undefined);
      return;
    }

    const currentResults = namespaces.map((ns) => results[ns]);

    // Check if we have data for all namespaces
    if (currentResults.some((r) => r === undefined)) {
      // Still waiting for some namespaces to report initial state
      // We can report loading
      onUpdate([], true, undefined);
      return;
    }

    // Combine data
    const combinedData = currentResults.flatMap((r) => r.data);
    const isLoading = currentResults.some((r) => r.isLoading);

    // Combine error (ignoring 403 Forbidden)
    const error = currentResults.find((r) => {
      const err = r.error;
      if (!err) {
        return false;
      }
      const errorObj = err as { code?: number; status?: number | { code?: number } };
      const isForbidden =
        errorObj.code === 403 ||
        errorObj.status === 403 ||
        (typeof errorObj.status === 'object' && errorObj.status?.code === 403);
      return !isForbidden;
    })?.error;

    onUpdate(combinedData, isLoading, error);
  }, [results, namespaces, onUpdate]);

  return (
    <>
      {namespaces.map((ns) => (
        <SingleNamespaceWatcher key={ns} namespace={ns} onUpdate={handleUpdate} />
      ))}
    </>
  );
};
