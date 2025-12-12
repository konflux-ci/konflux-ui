import * as React from 'react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { ReleaseGroupVersionKind, ReleaseModel } from '~/models';
import { MonitoredReleaseKind } from '~/types';

type ReleasesInNamespaceProps = {
  namespace: string;
  onReleasesLoaded: (releases: MonitoredReleaseKind[]) => void;
  onError: (error: unknown) => void;
};

const ReleasesInNamespace: React.FC<ReleasesInNamespaceProps> = ({
  namespace,
  onReleasesLoaded,
  onError,
}) => {
  const releasesDataRef = React.useRef<MonitoredReleaseKind[]>([]);
  const isLoadingRef = React.useRef(false);
  const errorRef = React.useRef<unknown>(null);
  const hasReportedRef = React.useRef(false);

  const { data, isLoading, clusterError, archiveError } =
    useK8sAndKarchResources<MonitoredReleaseKind>(
      {
        groupVersionKind: ReleaseGroupVersionKind,
        namespace,
        isList: true,
      },
      ReleaseModel,
    );

  React.useEffect(() => {
    // Reset report flag when namespace changes or when transitioning to loading
    hasReportedRef.current = false;
  }, [namespace]);

  const onErrorRef = React.useRef(onError);
  const onReleasesLoadedRef = React.useRef(onReleasesLoaded);

  React.useEffect(() => {
    onErrorRef.current = onError;
    onReleasesLoadedRef.current = onReleasesLoaded;
  });

  React.useEffect(() => {
    releasesDataRef.current = data || [];
    isLoadingRef.current = isLoading;
    errorRef.current = clusterError && archiveError;

    if (!isLoading && !hasReportedRef.current) {
      const error = clusterError && archiveError;
      if (error) {
        onErrorRef.current(error);
        hasReportedRef.current = true;
      } else if (data) {
        onReleasesLoadedRef.current(data);
        hasReportedRef.current = true;
      }
    }
  }, [data, isLoading, clusterError, archiveError]);

  return null;
};

export default ReleasesInNamespace;
