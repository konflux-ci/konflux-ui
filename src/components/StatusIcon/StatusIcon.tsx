import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons';
import { css } from '@patternfly/react-styles';
import {
  getRunStatusModifier,
  RunStatus,
  StatusIcon as PfStatusIcon,
} from '@patternfly/react-topology';
import pipelineStyles from '@patternfly/react-topology/dist/esm/css/topology-pipelines';
import { runStatus } from '~/consts/pipelinerun';
import { getLabelColorFromStatus, runStatusToRunStatus } from '../../utils/pipeline-utils';

import './StatusIcon.scss';

type StatusIconProps = {
  status: runStatus;
  height?: number;
  width?: number;
  disableSpin?: boolean;
};

export const StatusIcon: React.FC<React.PropsWithChildren<StatusIconProps>> = ({
  status,
  ...props
}) => {
  if (status === runStatus.Cancelling) {
    // Interim state required to avoid any other actions on pipelinerun that is currently being cancelled.
    return (
      <span
        className={css(
          pipelineStyles.topologyPipelinesStatusIcon,
          getRunStatusModifier(RunStatus.Cancelled),
        )}
      >
        <ExclamationTriangleIcon {...props} />
      </span>
    );
  }
  return <PfStatusIcon status={runStatusToRunStatus(status)} {...props} />;
};

export const ColoredStatusIcon: React.FC<React.PropsWithChildren<StatusIconProps>> = ({
  status,
  ...others
}) => {
  return (
    <div
      className={css(
        'status-icon',
        pipelineStyles.topologyPipelinesStatusIcon,
        (status === runStatus.Running || status === runStatus['In Progress']) && 'icon-spin',
        getRunStatusModifier(runStatusToRunStatus(status)),
      )}
    >
      <StatusIcon status={status} {...others} />
    </div>
  );
};

export const StatusIconWithText: React.FC<
  React.PropsWithChildren<StatusIconProps & { text?: string; dataTestAttribute?: string }>
> = ({ status, text, dataTestAttribute, ...others }) => {
  return (
    <>
      <span
        className={css(
          'pf-v5-u-mr-xs status-icon',
          pipelineStyles.topologyPipelinesPillStatus,
          (status === runStatus.Running || status === runStatus['In Progress']) && 'icon-spin',
          getRunStatusModifier(runStatusToRunStatus(status)),
        )}
      >
        <StatusIcon status={status} {...others} />
      </span>
      <span data-test={dataTestAttribute}>{text ?? status}</span>
    </>
  );
};

export const StatusIconWithTextLabel: React.FC<
  React.PropsWithChildren<StatusIconProps & { text?: string; dataTestAttribute?: string }>
> = ({ status, ...others }) => {
  return (
    <Label color={getLabelColorFromStatus(status)}>
      <StatusIconWithText status={status} {...others} />
    </Label>
  );
};
