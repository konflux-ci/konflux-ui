import * as React from 'react';
import { Icon } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { RhUiCheckCircleFillIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-check-circle-fill-icon';
import { RhUiErrorFillIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-error-fill-icon';
import { RhUiWarningFillIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-warning-fill-icon';
import { t_global_text_color_subtle as grayColor } from '@patternfly/react-tokens/dist/js/t_global_text_color_subtle';

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

/** Props for status icons backed by PatternFly `Icon` (color comes from `status`, not `color`). */
export type StatusIconProps = Omit<React.ComponentProps<typeof Icon>, 'status' | 'children'>;

export const GrayPencilAltIcon: React.FC<
  React.PropsWithChildren<ColoredIconProps & React.ComponentProps<typeof PencilAltIcon>>
> = ({ className, title, size, ...props }) => (
  <PencilAltIcon
    data-test="pencil-icon"
    size={size}
    color={grayColor.value}
    className={className}
    title={title}
    {...props}
  />
);

export const WarningIcon: React.FC<StatusIconProps> = (props) => (
  <Icon status="warning" {...props}>
    <RhUiWarningFillIcon />
  </Icon>
);

export const SuccessIcon: React.FC<StatusIconProps> = (props) => (
  <Icon status="success" {...props}>
    <RhUiCheckCircleFillIcon />
  </Icon>
);

export const ErrorIcon: React.FC<StatusIconProps> = (props) => (
  <Icon status="danger" {...props}>
    <RhUiErrorFillIcon />
  </Icon>
);
