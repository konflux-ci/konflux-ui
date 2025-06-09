import React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { BackgroundTaskInfo } from '~/consts/backgroundjobs';
import { useRunningTaskActions } from '~/shared/hooks/usePreventWindowClose';

const RunningTasksAlert: React.FC = () => {
  const runningActions = useRunningTaskActions();

  const activePages = Object.values(BackgroundTaskInfo).filter((pageInfo) =>
    runningActions.includes(pageInfo.action),
  );

  if (activePages.length === 0) {
    return null;
  }

  return (
    <Alert title="Tasks running in background" variant={AlertVariant.warning} isInline>
      <p>Please keep this window open while we link secrets to the service accounts.</p>
    </Alert>
  );
};

export default RunningTasksAlert;
