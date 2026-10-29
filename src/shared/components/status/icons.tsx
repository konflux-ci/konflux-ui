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
  color?:string
};

export type SuccessIconProps = {
  isInline?: boolean;
};

export type ErrorIconProps = {
  isInline?: boolean;
};

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

export const WarningIcon : React.FC<React.PropsWithChildren<SuccessIconProps & ColoredIconProps>> = ({ size })=> (
  <Icon status="warning" size={size}>
    <RhUiWarningFillIcon />
  </Icon>
);

export const SuccessIcon: React.FC<React.PropsWithChildren<SuccessIconProps & ColoredIconProps>> = ({ isInline }) => (
  <Icon status="success" isInline={isInline}>
    <RhUiCheckCircleFillIcon />
  </Icon>
);

export const ErrorIcon: React.FC<React.PropsWithChildren<ErrorIconProps  & ColoredIconProps>> = ({ isInline }) => (
  <Icon status="danger" isInline={isInline}>
    <RhUiErrorFillIcon />
  </Icon>
);
