import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useK8sWatchResource } from '~/k8s';
import { PodModel } from '~/models/pod';
import { TaskRunKind } from '~/types';
import { WatchK8sResource } from '~/types/k8s';
import { PodKind } from '../../types';
import { MultiStreamLogs } from './MultiStreamLogs';
import { TektonTaskRunLog } from './TektonTaskRunLog';

type K8sAndTektonLogsWrapperProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  resource: WatchK8sResource;
};

const K8sAndTektonLogsWrapper: React.FC<React.PropsWithChildren<K8sAndTektonLogsWrapperProps>> = ({
  resource,
  taskRun,
  onDownloadAll,
  downloadAllLabel = 'Download all',
  ...props
}) => {
  const {
    data: obj,
    isLoading,
    error,
  } = useK8sWatchResource<PodKind>({ ...resource, watch: true }, PodModel, { retry: false });

  return (
    <>
      {!isLoading || error ? (
        <>
          {!error ? (
            <MultiStreamLogs
              {...props}
              taskRun={taskRun}
              resourceName={resource?.name}
              resource={obj}
              onDownloadAll={onDownloadAll}
              downloadAllLabel={downloadAllLabel}
            />
          ) : (
            <TektonTaskRunLog
              taskRun={taskRun}
              onDownloadAll={onDownloadAll}
              downloadAllLabel={downloadAllLabel}
            />
          )}
        </>
      ) : (
        <Bullseye>
          <Spinner size="lg" />
        </Bullseye>
      )}
    </>
  );
};

export default K8sAndTektonLogsWrapper;
