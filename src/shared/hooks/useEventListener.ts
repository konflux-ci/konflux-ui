import * as React from 'react';
import { useEvent } from './useEvent';

/**
 * Custom hook that create event listener for Dom elements
 * @template T type of element (default: HTMLElement)
 * @param {string} eventName Name of the event to listen for.
 * @param {(event: Event) => void} handler Event handler function
 * @param {T | React.RefObject<T> | Window} target Dom element to attach the event listener
 * @param {AddEventListenerOptions} options Options for the event listener
 */
export const useEventListener = <
  T extends HTMLElement | SVGAElement | MediaQueryList = HTMLElement,
>(
  eventName: string,
  handler: (event: Event) => void,
  target: T | React.RefObject<T> | Window = window,
  options?: AddEventListenerOptions,
): void => {
  const eventHandler = useEvent(handler);

  React.useEffect(() => {
    const el: T = (target as React.RefObject<T>).current ?? (target as T);

    if (!(el && el.addEventListener)) return;

    el.addEventListener(eventName, eventHandler, options);

    return () => {
      el.removeEventListener(eventName, eventHandler, options);
    };
  }, [target, eventName, options, eventHandler]);
};
