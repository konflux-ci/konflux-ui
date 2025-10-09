import * as React from 'react';
import { LinkProps, useLinkClickHandler, useResolvedPath } from 'react-router-dom';
import { Tab, TabTitleText } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { DetailsPageTabProps } from './types';

// Helper function to extract string content from React.ReactNode for string operations
const getStringFromLabel = (label: React.ReactNode): string => {
  if (typeof label === 'string') {
    return label;
  }
  if (typeof label === 'number') {
    return label.toString();
  }
  // For complex React nodes, extract text content recursively
  if (React.isValidElement(label)) {
    if (typeof label.props.children === 'string') {
      return label.props.children;
    }
    if (Array.isArray(label.props.children)) {
      return label.props.children
        .map((child: React.ReactNode) => getStringFromLabel(child))
        .filter(Boolean)
        .join(' ');
    }
    return getStringFromLabel(label.props.children as React.ReactNode);
  }
  if (Array.isArray(label)) {
    return label
      .map((item: React.ReactNode) => getStringFromLabel(item))
      .filter(Boolean)
      .join(' ');
  }
  return '';
};

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
  const labelString = getStringFromLabel(label);
  return (
    <Tab
      {...rest}
      data-test={`details__tabItem ${labelString.toLocaleLowerCase().replace(/\s/g, '')}`}
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
