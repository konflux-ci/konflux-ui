import { runStatus } from '~/utils/pipeline-utils';
import { BackgroundJobStatus } from '~/utils/task-store';
import { StatusIconWithText } from './StatusIcon';

export const mapBackgroundStatusToRunStatus = (status: BackgroundJobStatus): runStatus => {
  const mapping: Record<BackgroundJobStatus, runStatus> = {
    [BackgroundJobStatus.Succeeded]: runStatus.Succeeded,
    [BackgroundJobStatus.Failed]: runStatus.Failed,
    [BackgroundJobStatus.Running]: runStatus.Running,
    [BackgroundJobStatus.Pending]: runStatus.Pending,
  };

  return mapping[status];
};

type Props = {
  status: BackgroundJobStatus;
  dataTestAttribute?: string;
};

export const BackgroundStatusIconWithText: React.FC<Props> = ({ status, dataTestAttribute }) => {
  const currentRunStatus = mapBackgroundStatusToRunStatus(status);

  return (
    <StatusIconWithText
      status={currentRunStatus}
      text={status}
      dataTestAttribute={dataTestAttribute}
    />
  );
};
