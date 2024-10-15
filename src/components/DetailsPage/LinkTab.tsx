import * as React from 'react';
import { LinkProps, useLinkClickHandler, useResolvedPath } from 'react-router-dom';
import { Tab, TabTitleText } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { DetailsPageTabProps } from './types';

type LinkTabProps = LinkProps & DetailsPageTabProps;

export const LinkTab: React.FC<React.PropsWithChildren<LinkTabProps>> = ({
  to,
  replace = false,
  target,
  state,
  key,
  label,
  isFilled,
  ...rest
}) => {
  const absolutePath = useResolvedPath(to);
  const handleClick = useLinkClickHandler(to, { target, replace, state });
  return (
    <Tab
      {...rest}
      data-test={`details__tabItem ${label.toLocaleLowerCase().replace(/\s/g, '')}`}
      key={key}
      eventKey={key}
      title={<TabTitleText>{label}</TabTitleText>}
      className={css('app-details__tabs__tabItem', { isFilled })}
      href={absolutePath.pathname}
      onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!event.defaultPrevented) {
          handleClick(event);
        }
      }}
    />
  );
};
