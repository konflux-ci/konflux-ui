import { NudgeConfigKind, NudgeMode, NudgeRelationship } from '~/types';

export const getOutgoingNudges = (
  nudgeConfig: NudgeConfigKind | null,
  componentName: string | undefined,
): NudgeRelationship[] => nudgeConfig?.spec.nudges?.filter((n) => n.from === componentName) ?? [];

export const getIncomingNudges = (
  nudgeConfig: NudgeConfigKind | null,
  componentName: string | undefined,
): NudgeRelationship[] => nudgeConfig?.spec.nudges?.filter((n) => n.to === componentName) ?? [];

export const getNudgeMode = (nudge: NudgeRelationship): NudgeMode => nudge.mode ?? 'immediate';
