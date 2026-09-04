import * as React from 'react';
import { Icon } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { css } from '@patternfly/react-styles';
import { t_global_text_color_subtle as grayColor } from '@patternfly/react-tokens/dist/js/t_global_text_color_subtle';

export type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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

/**
 * Shared warning icon so every warning indicator renders with the same
 * PatternFly warning color. Uses the `pf-v6-c-icon__content pf-m-warning`
 * classes so the color follows the live theme token instead of a fixed hex.
 */
export const WarningIcon: React.FC<
  ColoredIconProps & React.ComponentProps<typeof ExclamationTriangleIcon>
> = ({ className, ...props }) => (
  <Icon className="pf-v6-u-ml-sm">
    <ExclamationTriangleIcon
      className={css('pf-v6-c-icon__content pf-m-warning', className)}
      {...props}
    />
  </Icon>
);
