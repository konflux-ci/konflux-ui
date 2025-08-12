import * as React from 'react';
import { TaskRunKind } from '../../../../types';
import { PodKind } from '../../types';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskRun?: TaskRunKind;
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

  return (
    <>
      {!loadingContainers && (
        <Logs
          resource={resource}
          containers={containers}
          allowAutoScroll
          downloadAllLabel={downloadAllLabel}
          onDownloadAll={onDownloadAll}
          taskRun={taskRun}
          isLoading={!!((loadingContainers || stillFetching) && resource)}
        />
      )}
    </>
  );
};
