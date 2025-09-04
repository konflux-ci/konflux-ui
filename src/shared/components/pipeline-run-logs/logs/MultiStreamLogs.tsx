import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { ResourceSource } from '~/types/k8s';
import { TaskRunKind } from '../../../../types';
import { PodKind } from '../../types';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskRun: TaskRunKind | null;
  resourceName: string;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  source?: ResourceSource;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskRun,
  resourceName,
  downloadAllLabel,
  onDownloadAll,
  source = ResourceSource.Cluster,
}) => {
  const { containers, stillFetching } = getRenderContainers(resource);
  const loadingContainers = resource?.metadata?.name !== resourceName;

  if (loadingContainers) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <Logs
      resource={resource}
      containers={containers}
      allowAutoScroll
      downloadAllLabel={downloadAllLabel}
      onDownloadAll={onDownloadAll}
      taskRun={taskRun}
      isLoading={!!((loadingContainers || stillFetching) && resource)}
      source={source}
    />
  );
};
