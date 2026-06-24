import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import WarningTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { NotStartedIcon } from '@patternfly/react-icons/dist/esm/icons/not-started-icon';
import { t_global_icon_color_status_danger_default as redColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_status_warning_default as orangeColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
import { runStatus } from '~/consts/pipelinerun';
import {
  GitOpsDeploymentHealthStatus,
  GitOpsDeploymentKind,
  GitOpsDeploymentStrategy,
} from '../types/gitops-deployment';

import './gitops-utils.scss';

export const getGitOpsDeploymentHealthStatusIcon = (status: GitOpsDeploymentHealthStatus) => {
  switch (status) {
    case GitOpsDeploymentHealthStatus.Healthy:
      return <CheckCircleIcon color={greenColor.value} />;
    case GitOpsDeploymentHealthStatus.Degraded:
      return <ExclamationCircleIcon color={redColor.value} />;
    case GitOpsDeploymentHealthStatus.Progressing:
      return <InProgressIcon />;
    case GitOpsDeploymentHealthStatus.Suspended:
    case GitOpsDeploymentHealthStatus.Missing:
    case GitOpsDeploymentHealthStatus.Unknown:
      return <NotStartedIcon />;
    default:
      return null;
  }
};

export const getGitOpsDeploymentStrategy = (resource: GitOpsDeploymentKind) => {
  return GitOpsDeploymentStrategy[resource.spec?.type];
};

export const getBuildStatusIcon = (status: runStatus) => {
  switch (status) {
    case runStatus.Succeeded:
      return <CheckCircleIcon color={greenColor.value} />;
    case runStatus.Failed:
      return <ExclamationCircleIcon color={redColor.value} />;
    case runStatus.Running:
    case runStatus['In Progress']:
    case runStatus.Cancelling:
      return <InProgressIcon className="status-icon-spin" />;
    case runStatus.Cancelled:
      return <WarningTriangleIcon color={orangeColor.value} />;
    case runStatus.PipelineNotStarted:
      return <WarningTriangleIcon color={orangeColor.value} />;
    default:
      return <NotStartedIcon />;
  }
};
