import * as React from 'react';
import konfluxMark from '~/assets/iconsUrl/konflux-mark.svg';

type KonfluxChatAvatarProps = {
  className?: string;
  iconClassName?: string;
};

export const KonfluxChatAvatar: React.FC<KonfluxChatAvatarProps> = ({
  className,
  iconClassName,
}) => (
  <span className={className} aria-hidden>
    <img src={konfluxMark} alt="" className={iconClassName} />
  </span>
);
