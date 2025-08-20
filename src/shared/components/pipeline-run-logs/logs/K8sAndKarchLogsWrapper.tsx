import * as React from 'react';
import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';
import { PodModel } from '../../../../models/pod';
import { TaskRunKind } from '../../../../types';
import { WatchK8sResource } from '../../../../types/k8s';
import ErrorEmptyState from '../../empty-state/ErrorEmptyState';
import { LoadingInline } from '../../status-box/StatusBox';
import { MultiStreamLogs } from './MultiStreamLogs';

type K8sAndKarchLogWrapperProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<void>;
  resource: WatchK8sResource;
};

const K8sAndKarchLogWrapper: React.FC<React.PropsWithChildren<K8sAndKarchLogWrapperProps>> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
  ...props
}) => {
  const resourceRef = React.useRef(null);
  const resourceInit = React.useMemo(
    () => ({
      model: PodModel,
      queryOptions: {
        name: resource.name,
        ns: resource.namespace,
      },
    }),
    [resource.name, resource.namespace],
  );
  const queryOptions = React.useMemo(() => ({ retry: false }), []);

  const {
    data: obj,
    source,
    isLoading,
    fetchError,
  } = useK8sAndKarchResource(resourceInit, queryOptions, true);

  if (!isLoading && !fetchError && resource.name === obj.metadata?.name) {
    resourceRef.current = obj;
  } else if (fetchError) {
    resourceRef.current = null;
  }

  if (isLoading) {
    return (
      <span
        className="multi-stream-logs__taskName__loading-indicator"
        data-testid="loading-indicator"
      >
        <LoadingInline />
      </span>
    );
  }

  if (fetchError) {
    return <ErrorEmptyState title="Error loading logs" body="Please try again later." />;
  }

  return (
    <MultiStreamLogs
      {...props}
      taskRun={taskRun}
      resourceName={resource?.name}
      resource={resourceRef.current}
      onDownloadAll={onDownloadAll}
      downloadAllLabel={downloadAllLabel}
      source={source}
    />
  );
};

export default K8sAndKarchLogWrapper;
