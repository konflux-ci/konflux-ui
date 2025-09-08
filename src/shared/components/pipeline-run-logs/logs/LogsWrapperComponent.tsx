import * as React from 'react';
import { Bullseye, Button, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { TaskRunKind } from '~/types';
import { WatchK8sResource } from '~/types/k8s';

const K8sAndKarchLogsWrapper = React.lazy(
  () => import('./K8sAndKarchLogsWrapper' /* webpackChunkName: "kubearchive-logs" */),
);
const K8sAndTektonLogsWrapper = React.lazy(
  () => import('./K8sAndTektonLogsWrapper' /* webpackChunkName: "tekton-logs" */),
);

class LoadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Failed to load component:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <Bullseye>
          <Text component={TextVariants.p}>An unknown error occurred.</Text>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Bullseye>
      );
    }
    return this.props.children;
  }
}

type LogsWrapperComponentProps = {
  taskRun: TaskRunKind;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  resource: WatchK8sResource;
};

const LogsWrapperComponent: React.FC<React.PropsWithChildren<LogsWrapperComponentProps>> = (
  props,
) => {
  const isKubearchiveEnabled = useIsOnFeatureFlag('kubearchive-logs');

  return (
    <LoadErrorBoundary>
      <React.Suspense
        fallback={
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        }
      >
        {isKubearchiveEnabled ? (
          <K8sAndKarchLogsWrapper {...props} />
        ) : (
          <K8sAndTektonLogsWrapper {...props} />
        )}
      </React.Suspense>
    </LoadErrorBoundary>
  );
};

export default LogsWrapperComponent;
