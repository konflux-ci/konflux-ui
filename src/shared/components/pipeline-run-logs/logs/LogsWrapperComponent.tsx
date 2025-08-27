import * as React from 'react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { TaskRunKind } from '../../../../types';
import { WatchK8sResource } from '../../../../types/k8s';
import { LoadingInline } from '../../status-box/StatusBox';

const K8sAndKarchLogsWrapper = React.lazy(() => import('./K8sAndKarchLogsWrapper'));
const K8sAndTektonLogsWrapper = React.lazy(() => import('./K8sAndTektonLogsWrapper'));

type LogsWrapperComponentProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<void>;
  resource: WatchK8sResource;
};

const LogsWrapperComponent: React.FC<React.PropsWithChildren<LogsWrapperComponentProps>> = (
  props,
) => {
  const isKubearchiveEnabled = useIsOnFeatureFlag('kubearchive-logs');

  return (
    <React.Suspense
      fallback={
        <span
          className="multi-stream-logs__taskName__loading-indicator"
          data-testid="loading-indicator"
        >
          <LoadingInline />
        </span>
      }
    >
      {isKubearchiveEnabled ? (
        <K8sAndKarchLogsWrapper {...props} />
      ) : (
        <K8sAndTektonLogsWrapper {...props} />
      )}
    </React.Suspense>
  );
};

export default LogsWrapperComponent;
