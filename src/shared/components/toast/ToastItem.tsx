import React from 'react';
import { Alert, AlertActionCloseButton, Progress } from '@patternfly/react-core';
import type { ToastId, ToastRecord } from './types';

type ToastItemProps = {
  toast: ToastRecord;
  onRemove: (id: ToastId) => void;
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const timer = React.useRef<number>();
  const timerGeneration = React.useRef(0);
  const startedAt = React.useRef(0);
  const remainingTime = React.useRef<number | false>(toast.timeout);
  const isHovered = React.useRef(false);
  const hasFocus = React.useRef(false);

  const clearTimer = React.useCallback(() => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
    timerGeneration.current++;
  }, []);

  const startTimer = React.useCallback(() => {
    if (
      typeof remainingTime.current !== 'number' ||
      timer.current !== undefined ||
      isHovered.current ||
      hasFocus.current
    ) {
      return;
    }

    const generation = ++timerGeneration.current;
    startedAt.current = Date.now();
    timer.current = window.setTimeout(() => {
      if (timerGeneration.current !== generation) return;
      timer.current = undefined;
      remainingTime.current = 0;
      onRemove(toast.id);
    }, remainingTime.current);
  }, [onRemove, toast.id]);

  const pauseTimer = React.useCallback(() => {
    if (timer.current === undefined || typeof remainingTime.current !== 'number') return;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    remainingTime.current = Math.max(0, remainingTime.current - (Date.now() - startedAt.current));
    timerGeneration.current++;
  }, []);

  const resumeTimer = React.useCallback(() => {
    if (!isHovered.current && !hasFocus.current) startTimer();
  }, [startTimer]);

  React.useEffect(() => {
    clearTimer();
    remainingTime.current = toast.timeout;
    startTimer();
    return clearTimer;
  }, [clearTimer, startTimer, toast.timeout, toast.timerVersion]);

  const handleMouseEnter = () => {
    isHovered.current = true;
    pauseTimer();
  };

  const handleMouseLeave = () => {
    isHovered.current = false;
    resumeTimer();
  };

  const handleFocus = () => {
    hasFocus.current = true;
    pauseTimer();
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    hasFocus.current = false;
    resumeTimer();
  };

  return (
    <Alert
      actionClose={
        toast.isDismissible ? (
          <AlertActionCloseButton
            aria-label={`Dismiss notification: ${toast.title}`}
            onClose={() => onRemove(toast.id)}
          />
        ) : undefined
      }
      component={toast.description != null || typeof toast.percentage === 'number' ? 'h4' : 'p'}
      data-test="toast-alert"
      id={toast.id}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      title={toast.title}
      timeout={false}
      variant={toast.variant}
    >
      {toast.description}
      {typeof toast.percentage === 'number' && (
        <Progress
          aria-label={toast.title}
          label={`${toast.percentage}%`}
          max={100}
          measureLocation="outside"
          min={0}
          value={toast.percentage}
        />
      )}
    </Alert>
  );
};
