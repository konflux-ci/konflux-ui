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
    releasesDataRef.current = data || [];
    isLoadingRef.current = isLoading;
    errorRef.current = clusterError && archiveError;

    if (!isLoading && !hasReportedRef.current) {
      const error = clusterError && archiveError;
      if (error) {
        onError(error);
        hasReportedRef.current = true;
      } else if (data) {
        onReleasesLoaded(data);
        hasReportedRef.current = true;
      }
    }
  }, [data, isLoading, clusterError, archiveError, onError, onReleasesLoaded]);

  return null;
};

export default ReleasesInNamespace;
