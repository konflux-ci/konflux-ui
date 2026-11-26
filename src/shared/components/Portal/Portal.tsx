import * as React from 'react';
import * as ReactDOM from 'react-dom';

type PortalProps = {
  children: React.ReactNode;
  container?: Element;
};

/** Renders children into a DOM node outside the current stacking context. */
export const Portal: React.FC<PortalProps> = ({ children, container = document.body }) =>
  ReactDOM.createPortal(children, container);
