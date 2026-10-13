export const TOUR_ACTIONS = {
  START: 'START',
  NEXT: 'NEXT',
  PREV: 'PREV',
  SKIP: 'SKIP',
  DONE: 'DONE',
} as const;

export const TOUR_STATUS = {
  COMPLETED: 'completed',
  DISMISSED: 'dismissed',
} as const;

export const STEP_TYPES = {
  MODAL: 'modal',
  SPOTLIGHT: 'spotlight',
  HIGHLIGHT: 'highlight',
} as const;

export const TOUR_STORAGE_KEY = 'konflux-tours';

/** Maps PopoverPosition config values to PF Popover position prop values */
export const POSITION_MAP: Record<string, 'top' | 'bottom' | 'left' | 'right' | 'auto'> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  auto: 'auto',
};

/**
 * Find a DOM element annotated with a data-tour attribute.
 */
export const getTourElement = (target: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
