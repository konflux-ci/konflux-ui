import {
  CriticalIcon,
  HighIcon,
  LowIcon,
  MediumIcon,
  UnknownIcon,
} from '~/components/PipelineRun/ScanDetailStatus';
import { IssueSeverity } from '~/kite/issue-type';

export const severityIcon = (severity: IssueSeverity) => {
  switch (severity) {
    case IssueSeverity.CRITICAL:
      return <CriticalIcon />;
    case IssueSeverity.MAJOR:
      return <HighIcon />;
    case IssueSeverity.MINOR:
      return <MediumIcon />;
    case IssueSeverity.INFO:
      return <LowIcon />;
    default:
      return <UnknownIcon />;
  }
};
