import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { IfFeature } from '~/feature-flags/hooks';
import { useAIChat } from '../hooks/useAIChat';
import { CONTEXT_HOVER_CLASS, CONTEXT_PICKING_BODY_CLASS } from './types';
import { findContextTargetAtPoint, parseContextTarget } from './utils';

import './chat-context.scss';

export const ChatContextPicker: React.FC = () => {
  const { isPickingContext, cancelContextPick, toggleContextSelection } = useAIChat();
  const { pathname } = useLocation();
  const hoveredElementRef = React.useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = React.useState('');

  const clearHover = React.useCallback(() => {
    if (hoveredElementRef.current) {
      hoveredElementRef.current.classList.remove(CONTEXT_HOVER_CLASS);
      hoveredElementRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!isPickingContext) {
      document.body.classList.remove(CONTEXT_PICKING_BODY_CLASS);
      clearHover();
      return undefined;
    }

    document.body.classList.add(CONTEXT_PICKING_BODY_CLASS);
    setAnnouncement(
      'Context selection mode active. Hover over a component to preview, then click to add or remove it.',
    );

    const handleMouseMove = (event: MouseEvent) => {
      const target = findContextTargetAtPoint(event.clientX, event.clientY, event.target);
      if (target === hoveredElementRef.current) {
        return;
      }
      clearHover();
      if (target) {
        target.classList.add(CONTEXT_HOVER_CLASS);
        hoveredElementRef.current = target;
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = findContextTargetAtPoint(event.clientX, event.clientY, event.target);
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const selection = parseContextTarget(target, pathname);
      if (selection) {
        toggleContextSelection(selection, target);
        setAnnouncement(`Toggled context: ${selection.label}`);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        clearHover();
        cancelContextPick();
        setAnnouncement('Context selection cancelled.');
      }
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.classList.remove(CONTEXT_PICKING_BODY_CLASS);
      clearHover();
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isPickingContext, pathname, cancelContextPick, toggleContextSelection, clearHover]);

  return (
    <IfFeature flag="ai-chat">
      <div className="pf-v5-u-screen-reader" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </IfFeature>
  );
};
