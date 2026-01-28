import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';
import { PodModel } from '~/models/pod';
import { getErrorState } from '~/shared/utils/error-utils';
import { TaskRunKind } from '~/types';
import { WatchK8sResource } from '~/types/k8s';
import { PodKind } from '../../types';
import { LOGS_QUERY_OPTIONS } from './const';
import { MultiStreamLogs } from './MultiStreamLogs';

type K8sAndKarchLogWrapperProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  resource: WatchK8sResource;
};

const K8sAndKarchLogWrapper: React.FC<React.PropsWithChildren<K8sAndKarchLogWrapperProps>> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
}) => {
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

  const {
    data: obj,
    isLoading,
    fetchError,
  } = useK8sAndKarchResource<PodKind>(resourceInit, LOGS_QUERY_OPTIONS, true);

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (fetchError) {
    return getErrorState(fetchError, !isLoading, 'logs');
  }

  return (
    <MultiStreamLogs
      taskRun={taskRun}
      resourceName={resource?.name}
      resource={obj}
      onDownloadAll={onDownloadAll}
      downloadAllLabel={downloadAllLabel}
      source={obj?.source}
    />
  );
};

export default K8sAndKarchLogWrapper;
