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
    <Alert title="Background tasks are running" variant={AlertVariant.warning} isInline>
      <p>Please do not close the window. The following tasks are still running:</p>
      <ul>
        {activePages.map((page) => (
          <li key={page.action}>
            <strong>{page.pageName}</strong>: {page.action}
          </li>
        ))}
      </ul>
    </Alert>
  );
};

export default RunningTasksAlert;
