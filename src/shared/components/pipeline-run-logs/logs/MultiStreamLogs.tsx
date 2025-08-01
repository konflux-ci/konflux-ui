import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { OutlinedPlayCircleIcon } from '@patternfly/react-icons/dist/esm/icons';
import { TaskRunKind } from '../../../../types';
import { LoadingInline } from '../../status-box/StatusBox';
import { PodKind } from '../../types';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';
import LogsTaskDuration from './LogsTaskDuration';

import './MultiStreamLogs.scss';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskRun?: TaskRunKind;
  resourceName: string;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskRun,
  resourceName,
  setCurrentLogsGetter,
}) => {
  const { containers, stillFetching } = getRenderContainers(resource);
  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const taskName = taskRun?.spec.taskRef?.name ?? taskRun?.metadata.name;
  const loadingContainers = resource?.metadata?.name !== resourceName;
  const [autoScroll, setAutoScroll] = React.useState(false);

  const hideResumeStreamButton = scrollDirection == null || scrollDirection === 'forward';

  const [logs, setLogs] = React.useState('');
  const handleCurrentLogsGetter = React.useCallback(
    (getter: () => string) => {
      setLogs(getter());
      return setCurrentLogsGetter(getter);
    },
    [setCurrentLogsGetter],
  );

  React.useEffect(() => {
    // scroll to the bottom while logs are loading
    if (logs) {
      setAutoScroll(true);
    }
  }, [logs]);

  return (
    <>
      <div className="multi-stream-logs__taskName" data-testid="logs-taskName">
        {taskName} <LogsTaskDuration taskRun={taskRun} />
        {(loadingContainers || stillFetching) && resource && (
          <span className="multi-stream-logs__taskName__loading-indicator">
            <LoadingInline />
          </span>
        )}
      </div>
      <div className="multi-stream-logs__container" data-testid="logs-task-container">
        {!loadingContainers && (
          <Logs
            resource={resource}
            containers={containers}
            setCurrentLogsGetter={handleCurrentLogsGetter}
            autoScroll={autoScroll}
            onScroll={({ scrollDirection: logViewerScrollDirection, scrollUpdateWasRequested }) => {
              setScrollDirection(logViewerScrollDirection);

              if (scrollUpdateWasRequested) {
                setAutoScroll(false);
              }
            }}
          />
        )}
      </div>

      <div>
        {!hideResumeStreamButton && (
          <Button data-testid="resume-log-stream" isBlock onClick={() => setAutoScroll(true)}>
            <OutlinedPlayCircleIcon /> Resume log stream
          </Button>
        )}
      </div>
    </>
  );
};
