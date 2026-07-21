import * as React from 'react';

export type StepType = 'modal' | 'spotlight' | 'highlight';
export type TourTrigger = 'auto' | 'manual';
export type TourStatus = 'completed' | 'dismissed';
export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface BaseStepConfig {
  title: string;
  content: string;
  closing?: boolean;
  /** Route override for cross-page steps */
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
  /** If true + auto, show confirmation prompt before starting */
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
  | { type: 'START'; payload: { mergedSteps: MergedStep[]; sourceIds: string[] } }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SKIP' }
  | { type: 'DONE' };

export interface TourContextValue {
  state: TourState;
  dispatch: React.Dispatch<TourAction>;
}
