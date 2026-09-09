import * as React from 'react';
import { STEP_TYPES, TOUR_ACTIONS, TOUR_STATUS } from './consts';

export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES];
export type TourTrigger = 'auto' | 'manual';
export type TourStatus = (typeof TOUR_STATUS)[keyof typeof TOUR_STATUS];
export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface BaseStepConfig {
  title: string;
  content: string;
  closing?: boolean;
  /**
   * Route override for cross-page steps.
   * TODO: Cross-page step navigation is not yet implemented. When a step has a different
   * route than the current page, the tour engine should pause, navigate to the target route,
   * and wait for the target element via MutationObserver. See design spec for full flow.
   */
  route?: string;
}

export interface ModalStepConfig extends BaseStepConfig {
  type: 'modal';
  variant?: 'small' | 'medium';
}

export interface SpotlightStepConfig extends BaseStepConfig {
  type: 'spotlight';
  /** data-tour attribute value of the target element */
  target: string;
  position?: PopoverPosition;
}

export interface HighlightStepConfig extends BaseStepConfig {
  type: 'highlight';
  /** data-tour attribute value of the target element */
  target: string;
  position?: PopoverPosition;
}

export type TourStepConfig = ModalStepConfig | SpotlightStepConfig | HighlightStepConfig;

export interface TourConfig {
  /** Unique identifier, also used as localStorage key */
  id: string;
  /** Route pattern to match (e.g., 'ns/:workspaceName/applications') */
  route: string;
  /** 'auto' = first visit trigger, 'manual' = help menu only */
  trigger: TourTrigger;
  /**
   * If true + auto, show confirmation prompt before starting.
   * TODO: PromptPopover component is not yet implemented. When prompt is true,
   * useTourAutoTrigger should show a "Want a quick tour?" confirmation instead
   * of auto-starting. See design spec for the PromptPopover specification.
   */
  prompt?: boolean;
  /** Controls ordering when merging (lower = earlier, default: 0) */
  priority?: number;
  /** Tour steps */
  steps: TourStepConfig[];
}

/** Runtime step with source tracking */
export interface MergedStep {
  step: TourStepConfig;
  sourceId: string;
}

export interface TourRecord {
  status: TourStatus;
  timestamp: number;
}

export type TourStorage = Record<string, TourRecord>;

// Reducer types
export interface TourState {
  isActive: boolean;
  mergedSteps: MergedStep[];
  currentStepIndex: number;
  sourceIds: string[];
}

export type TourAction =
  | { type: typeof TOUR_ACTIONS.START; payload: { mergedSteps: MergedStep[]; sourceIds: string[] } }
  | { type: typeof TOUR_ACTIONS.NEXT }
  | { type: typeof TOUR_ACTIONS.PREV }
  | { type: typeof TOUR_ACTIONS.SKIP }
  | { type: typeof TOUR_ACTIONS.DONE };

export interface TourContextValue {
  state: TourState;
  dispatch: React.Dispatch<TourAction>;
  currentRoute: string | undefined;
  setCurrentRoute: (route: string | undefined) => void;
}
