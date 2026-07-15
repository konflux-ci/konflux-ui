import * as React from 'react';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
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
