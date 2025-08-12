import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { commonFetchText } from '../../../../k8s';
import { getK8sResourceURL, getWebsocketSubProtocolAndPathPrefix } from '../../../../k8s/k8s-utils';
import { MessageHandler, WebSocketOptions } from '../../../../k8s/web-socket/types';
import { WebSocketFactory } from '../../../../k8s/web-socket/WebSocketFactory';
import { PodModel } from '../../../../models/pod';
import { TaskRunKind } from '../../../../types';
import { useNamespace } from '../../../providers/Namespace';
import { PodKind, ContainerSpec, ContainerStatus } from '../../types';
import { containerToLogSourceStatus, LOG_SOURCE_TERMINATED } from '../utils';
import LogViewer, { type Props as LogViewerProps } from './LogViewer';

type LogSources = { [containerName: string]: string };

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
    if (retryCount < 5) {
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
  taskRun: TaskRunKind;
  isLoading: boolean;
  allowAutoScroll: boolean;
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
}) => {
  const { t } = useTranslation();
  const namespace = useNamespace();
  const { metadata = {} } = resource;
  const { name: resName, namespace: resNamespace } = metadata;

  // state to hold the logs for each container individually
  const [logSources, setLogSources] = React.useState<LogSources>({});
  const [error, setError] = React.useState<boolean>(false);
  // state to track which containers we've already started fetching
  const [activeContainers, setActiveContainers] = React.useState<Set<string>>(new Set());

  const appendLog = React.useCallback((containerName: string, message: string) => {
    setLogSources((prev) => ({
      ...prev,
      [containerName]: (prev[containerName] || '') + message,
    }));
  }, []);

  // loops through th containers and initiates fetching for each one
  React.useEffect(() => {
    containers.forEach((container) => {
      if (activeContainers.has(container.name)) return;
      setActiveContainers((prev) => new Set(prev).add(container.name));

      let loaded = false;
      let ws: WebSocketFactory;
      const { name } = container;

      const allStatuses: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
      const status = allStatuses.find((c) => c.name === name);
      const resourceStatus = containerToLogSourceStatus(status);

      const urlOpts = {
        ns: resNamespace,
        ws: namespace,
        name: resName,
        path: 'log',
        queryParams: { container: name, follow: 'true' },
      };
      const watchURL = getK8sResourceURL(PodModel, undefined, urlOpts);

      if (resourceStatus === LOG_SOURCE_TERMINATED) {
        commonFetchText(watchURL)
          .then((res) => !loaded && appendLog(name, res))
          .catch(() => !loaded && setError(true));
      } else {
        const wsOpts = getWebsocketSubProtocolAndPathPrefix(watchURL);
        ws = retryWebSocket(
          watchURL,
          wsOpts,
          (msg) => {
            // onMessage callback
            if (loaded) return;
            setError(false); // clear any previous errors on success
            appendLog(name, Base64.decode(msg as string));
          },
          () => {
            // onError callback
            if (loaded) return;
            setError(true);
          },
        );
      }

      return () => {
        loaded = true;
        if (ws) {
          ws.destroy();
        }
      };
    });
  }, [containers, resource, resName, resNamespace, activeContainers, appendLog, t, namespace]);

  const formattedLogs = React.useMemo(
    () => processLogs(logSources, containers),
    [logSources, containers],
  );

  return (
    <LogViewer
      data={formattedLogs}
      allowAutoScroll={allowAutoScroll}
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
