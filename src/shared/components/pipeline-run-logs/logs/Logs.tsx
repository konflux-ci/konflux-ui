import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { type LogSection } from '~/shared/components/virtualized-log-viewer';
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
type LogErrors = { [containerName: string]: string };

const WEB_SOCKET_RETRY_COUNT = 5;

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

  // An archived pod (fetched from KubeArchive rather than the live cluster) can never have
  // "live" logs to stream -- the pod is already gone from the cluster by definition. Treat
  // every one of its containers as terminated so we always use the plain HTTP/kubearchive
  // fetch path below, and never attempt to open a websocket watch against a pod that no
  // longer exists (which would just fail with a 404 on the websocket upgrade handshake).
  const isArchiveSource = isKubearchiveEnabled && source === ResourceSource.Archive;

  const getEffectiveLogSourceStatus = React.useCallback(
    (status: ContainerStatus | undefined) =>
      isArchiveSource ? LOG_SOURCE_TERMINATED : containerToLogSourceStatus(status),
    [isArchiveSource],
  );

  // state to hold the logs for each container individually
  const [logSources, setLogSources] = React.useState<LogSources>({});
  // per-container fetch errors, so a single failed step doesn't fail the whole log view
  const [logErrors, setLogErrors] = React.useState<LogErrors>({});
  const pendingFetchesRef = React.useRef(0);
  const [isFetchingLogs, setIsFetchingLogs] = React.useState(false);
  // to track which containers already started fetching
  const connectionManagerRef = React.useRef(new Map<string, () => void>());

  const appendLog = React.useCallback((containerName: string, message: string) => {
    setLogSources((prev) => ({
      ...prev,
      [containerName]: (prev[containerName] || '') + message,
    }));
  }, []);

  const setContainerError = React.useCallback((containerName: string, message: string) => {
    setLogErrors((prev) => ({ ...prev, [containerName]: message }));
  }, []);

  const clearContainerError = React.useCallback((containerName: string) => {
    setLogErrors((prev) => {
      if (!(containerName in prev)) return prev;
      const next = { ...prev };
      delete next[containerName];
      return next;
    });
  }, []);

  // loops through the containers and initiates fetching for each one
  React.useEffect(() => {
    const activeConnections = connectionManagerRef.current;

    const markFetchStarted = () => {
      pendingFetchesRef.current += 1;
      if (pendingFetchesRef.current === 1) {
        setIsFetchingLogs(true);
      }
    };

    const markFetchFinished = () => {
      pendingFetchesRef.current = Math.max(0, pendingFetchesRef.current - 1);
      if (pendingFetchesRef.current === 0) {
        setIsFetchingLogs(false);
      }
    };

    containers.forEach((container) => {
      if (activeConnections.has(container.name)) {
        return;
      }

      const { name } = container;
      const allStatuses: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
      const status = allStatuses.find((c) => c.name === name);
      const resourceStatus = getEffectiveLogSourceStatus(status);

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

        markFetchStarted();
        commonFetchText(watchURL, {
          signal,
          ...(isArchiveSource ? { pathPrefix: KUBEARCHIVE_PATH_PREFIX } : undefined),
        })
          .then((res) => {
            clearContainerError(name);
            appendLog(name, res);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              // Gracefully handle empty logs (404) from kubearch, similar to how Tekton Results handles 404
              // When logs don't exist, both kubearch and Tekton Results return 404
              if (err?.code === 404) {
                // Don't show an error for missing logs - just leave it empty
                // This matches the behavior of Tekton Results which returns empty logs for 404
                return;
              }

              // Surface the failure on this specific step only, so other steps' logs
              // (already fetched or still in flight) continue to be shown.
              setContainerError(
                name,
                err instanceof Error
                  ? err.message
                  : String(t('An error occurred while retrieving the requested logs.')),
              );
            }
          })
          .finally(markFetchFinished);

        activeConnections.set(name, () => controller.abort());
      } else {
        const wsOpts = getWebsocketSubProtocolAndPathPrefix(watchURL);
        const ws = retryWebSocket(
          watchURL,
          wsOpts,
          (msg) => {
            clearContainerError(name);
            appendLog(name, Base64.decode(msg as string));
          },
          () => {
            setContainerError(
              name,
              String(t('An error occurred while retrieving the requested logs.')),
            );
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
  }, [
    containers,
    resource,
    resName,
    resNamespace,
    appendLog,
    setContainerError,
    clearContainerError,
    isArchiveSource,
    getEffectiveLogSourceStatus,
    t,
  ]);

  const allLogsTerminated = React.useMemo<boolean>(() => {
    if (containers.length === 0) return false;

    const allStatuses: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
    const runningContainers: string[] = [];

    containers.forEach((container) => {
      const status = allStatuses.find((c) => c.name === container.name);
      const resourceStatus = getEffectiveLogSourceStatus(status);

      if (resourceStatus !== LOG_SOURCE_TERMINATED) {
        runningContainers.push(container.name);
      }
    });

    return runningContainers.length === 0;
  }, [containers, resource?.status?.containerStatuses, getEffectiveLogSourceStatus]);

  const sections = React.useMemo<LogSection[]>(() => {
    const allStatuses: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
    // Only containers that have log data and/or a fetch error are shown, so a step that
    // failed to fetch is still shown (with its error) alongside steps that succeeded.
    return containers
      .filter((c) => logSources[c.name] || logErrors[c.name])
      .map((c) => {
        const status = allStatuses.find((s) => s.name === c.name);
        return {
          containerName: c.name.toUpperCase(),
          data: logSources[c.name] ?? '',
          isCompleted: getEffectiveLogSourceStatus(status) === LOG_SOURCE_TERMINATED,
          error: logErrors[c.name],
        };
      });
  }, [
    logSources,
    logErrors,
    containers,
    resource?.status?.containerStatuses,
    getEffectiveLogSourceStatus,
  ]);

  return (
    <LogViewer
      sections={sections}
      allowAutoScroll={allowAutoScroll && !allLogsTerminated}
      onScroll={onScroll}
      downloadAllLabel={downloadAllLabel}
      onDownloadAll={onDownloadAll}
      taskRun={taskRun}
      isLoading={isLoading || isFetchingLogs}
      errorMessage={null}
    />
  );
};

export default Logs;
