import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
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
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskRun,
  resourceName,
  downloadAllLabel,
  onDownloadAll,
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
    />
  );
};
