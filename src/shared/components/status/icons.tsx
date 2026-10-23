import * as React from 'react';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { t_global_icon_color_status_warning_default as warningColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
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
 * Standard warning icon. The colour comes from the PatternFly CSS variable
 * rather than the token's static `value`: the generated `value` snapshot for
 * this token is the dark text shade (#73480b), while the variable resolves to
 * the yellow-orange status colour (#dca614 in the light theme) and follows the
 * active theme.
 */
export const WarningIcon: React.FC<
  ColoredIconProps & React.ComponentProps<typeof ExclamationTriangleIcon>
> = (props) => (
  <ExclamationTriangleIcon color={warningColor.var} {...props} />
);
