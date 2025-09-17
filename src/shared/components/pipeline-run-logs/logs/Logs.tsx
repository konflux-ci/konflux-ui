import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { ResourceSource } from '~/types/k8s';
import { commonFetchText } from '../../../../k8s';
import { getK8sResourceURL, getWebsocketSubProtocolAndPathPrefix } from '../../../../k8s/k8s-utils';
import { MessageHandler, WebSocketOptions } from '../../../../k8s/web-socket/types';
import { WebSocketFactory } from '../../../../k8s/web-socket/WebSocketFactory';
import { PodModel } from '../../../../models/pod';
import { TaskRunKind } from '../../../../types';
import { PodKind, ContainerSpec, ContainerStatus } from '../../types';
import { containerToLogSourceStatus, LOG_SOURCE_TERMINATED } from '../utils';
import LogViewer, { type Props as LogViewerProps } from './LogViewer';

type LogSources = { [containerName: string]: string };

const WEB_SOCKET_RETRY_COUNT = 5;

export const processLogs = (logSources: LogSources, containers: ContainerSpec[]): string => {
  let allLogs = '';
  for (const container of containers) {
    const containerName = container.name;
    if (logSources[containerName]) {
      allLogs += `\n\n${containerName.toUpperCase()}\n`;

      const indentedLogs = logSources[containerName]
        ?.split('\n')
        ?.map((line) => `  ${line}`)
        ?.join('\n');

      allLogs += indentedLogs;
    }
  }
  return allLogs.trim();
};

const retryWebSocket = (
  watchURL: string,
  wsOpts: WebSocketOptions,
  onMessage: MessageHandler,
  onError: () => void,
  retryCount = 0,
) => {
  const ws = new WebSocketFactory(watchURL, wsOpts);

  const handleError = () => {
    // stop retrying after 5 attempts
    if (retryCount < WEB_SOCKET_RETRY_COUNT) {
      setTimeout(() => {
        retryWebSocket(watchURL, wsOpts, onMessage, onError, retryCount + 1);
      }, 3000); // retry after 3 seconds
    } else {
      onError();
    }
  };

  ws.onMessage(onMessage).onError(handleError);

  return ws;
};

type LogsProps = {
  resource: PodKind;
  containers: ContainerSpec[];
  onScroll?: LogViewerProps['onScroll'];
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  taskRun: TaskRunKind | null;
  isLoading: boolean;
  allowAutoScroll: boolean;
  source: ResourceSource;
};

const Logs: React.FC<LogsProps> = ({
  resource,
  containers,
  onScroll,
  downloadAllLabel,
  onDownloadAll,
  taskRun,
  isLoading,
  allowAutoScroll,
  source,
}) => {
  const { t } = useTranslation();
  const isKubearchiveEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const { metadata = {} } = resource;
  const { name: resName, namespace: resNamespace } = metadata;

  // state to hold the logs for each container individually
  const [logSources, setLogSources] = React.useState<LogSources>({});
  const [error, setError] = React.useState<boolean>(false);
  // to track which containers already started fetching
  const connectionManagerRef = React.useRef(new Map<string, () => void>());

  const appendLog = React.useCallback((containerName: string, message: string) => {
    setLogSources((prev) => ({
      ...prev,
      [containerName]: (prev[containerName] || '') + message,
    }));
  }, []);

  // loops through the containers and initiates fetching for each one
  React.useEffect(() => {
    const activeConnections = connectionManagerRef.current;

    containers.forEach((container) => {
      if (activeConnections.has(container.name)) {
        return;
      }

      const { name } = container;
      const allStatuses: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
      const status = allStatuses.find((c) => c.name === name);
      const resourceStatus = containerToLogSourceStatus(status);

      const urlOpts = {
        ns: resNamespace,
        name: resName,
        path: 'log',
        queryParams: {
          container: name,
          follow: resourceStatus === LOG_SOURCE_TERMINATED ? 'false' : 'true',
        },
      };
      const watchURL = getK8sResourceURL(PodModel, undefined, urlOpts);

      if (resourceStatus === LOG_SOURCE_TERMINATED) {
        const controller = new AbortController();
        const { signal } = controller;

        commonFetchText(watchURL, {
          signal,
          ...(isKubearchiveEnabled && source === ResourceSource.Archive
            ? { pathPrefix: KUBEARCHIVE_PATH_PREFIX }
            : undefined),
        })
          .then((res) => appendLog(name, res))
          .catch((err) => {
            if (err.name !== 'AbortError') {
              appendLog(
                name,
                `\x1b[1;31mLOG FETCH ERROR${err instanceof Error ? `:\n${err.message}` : ''}\x1b[0m\n`,
              );
            }
          });

        activeConnections.set(name, () => controller.abort());
      } else {
        const wsOpts = getWebsocketSubProtocolAndPathPrefix(watchURL);
        const ws = retryWebSocket(
          watchURL,
          wsOpts,
          (msg) => {
            setError(false);
            appendLog(name, Base64.decode(msg as string));
          },
          () => {
            setError(true);
          },
        );

        activeConnections.set(name, () => ws.destroy());
      }
    });

    return () => {
      const containerNames = new Set(containers.map((c) => c.name));

      activeConnections.forEach((destroy, name) => {
        if (!containerNames.has(name)) {
          destroy();
          activeConnections.delete(name);
        }
      });
    };
  }, [containers, resource, resName, resNamespace, appendLog, source, isKubearchiveEnabled]);

  const formattedLogs = React.useMemo(
    () => processLogs(logSources, containers),
    [logSources, containers],
  );

  const allLogsTerminated = React.useMemo<boolean>(() => {
    if (containers.length === 0) return false;

    const allStatuses: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
    const terminatedContainers: string[] = [];
    const runningContainers: string[] = [];

    containers.forEach((container) => {
      const status = allStatuses.find((c) => c.name === container.name);
      const resourceStatus = containerToLogSourceStatus(status);

      if (resourceStatus === LOG_SOURCE_TERMINATED) {
        terminatedContainers.push(container.name);
      } else {
        runningContainers.push(container.name);
      }
    });

    const allTerminated = runningContainers.length === 0;

    return allTerminated;
  }, [containers, resource?.status?.containerStatuses]);

  return (
    <LogViewer
      data={formattedLogs}
      allowAutoScroll={allowAutoScroll && !allLogsTerminated}
      onScroll={onScroll}
      downloadAllLabel={downloadAllLabel}
      onDownloadAll={onDownloadAll}
      taskRun={taskRun}
      isLoading={isLoading}
      errorMessage={error ? t('An error occurred while retrieving the requested logs.') : null}
    />
  );
};

export default Logs;
