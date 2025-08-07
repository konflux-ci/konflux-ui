import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { OutlinedPlayCircleIcon } from '@patternfly/react-icons/dist/esm/icons';
import { TaskRunKind } from '../../../../types';
import { PodKind } from '../../types';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';

import './MultiStreamLogs.scss';

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
  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const loadingContainers = resource?.metadata?.name !== resourceName;
  const [autoScroll, setAutoScroll] = React.useState(false);

  const hideResumeStreamButton = scrollDirection == null || scrollDirection === 'forward';

  // track when logs become available to enable auto-scroll
  const [currentLogs, setCurrentLogs] = React.useState('');
  React.useEffect(() => {
    if (currentLogs) {
      setAutoScroll(true);
    }
  }, [currentLogs]);

  return (
    <>
      <div className="multi-stream-logs__container" data-testid="logs-task-container">
        {!loadingContainers && (
          <Logs
            resource={resource}
            containers={containers}
            onLogsChange={setCurrentLogs}
            autoScroll={autoScroll}
            onScroll={({ scrollDirection: logViewerScrollDirection, scrollUpdateWasRequested }) => {
              setScrollDirection(logViewerScrollDirection);

              if (scrollUpdateWasRequested) {
                setAutoScroll(false);
              }
            }}
            downloadAllLabel={downloadAllLabel}
            onDownloadAll={onDownloadAll}
            taskRun={taskRun}
            isLoading={!!((loadingContainers || stillFetching) && resource)}
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
