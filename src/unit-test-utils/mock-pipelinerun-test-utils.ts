/**
 * Shared test utilities for PipelineRun components
 */

import { PipelineRunKind, TaskRunKind } from '~/types';

/**
 * Mock state helpers for usePipelineRunV2 hook
 * Returns [data, loaded, error] tuple
 */
export const createPipelineRunMockStates = () => ({
  loading: () => [null, false, undefined] as const,
  loaded: (data: PipelineRunKind) => [data, true, undefined] as const,
  error: (error: { message: string; code: number }) => [null, true, error] as const,
});

/**
 * Mock state helpers for useTaskRunsForPipelineRuns hook
 * Returns [data, loaded, error, getNextPage, { hasNextPage, isFetchingNextPage }] tuple
 */
export const createTaskRunsMockStates = () => ({
  loading: () =>
    [[], false, undefined, jest.fn(), { hasNextPage: false, isFetchingNextPage: false }] as const,
  loaded: (data: TaskRunKind[]) =>
    [data, true, undefined, jest.fn(), { hasNextPage: false, isFetchingNextPage: false }] as const,
  error: (error: Error) =>
    [null, true, error, jest.fn(), { hasNextPage: false, isFetchingNextPage: false }] as const,
});

/**
 * Mock state helpers for usePipelineRunsForCommitV2 hook
 * Returns [data, loaded] tuple
 */
export const createPipelineRunsForCommitMockStates = () => ({
  loading: () => [[], false] as const,
  loaded: (data: PipelineRunKind[]) => [data, true] as const,
});

/**
 * Setup getBBox mock for PatternFly Topology visualization
 * Required for SVG rendering in jsdom test environment
 *
 * Usage: Call this in beforeAll() block
 *
 * @example
 * beforeAll(() => {
 *   setupGetBBoxMock();
 * });
 */
export const setupGetBBoxMock = () => {
  (
    SVGElement.prototype as unknown as {
      getBBox: () => { x: number; y: number; width: number; height: number };
    }
  ).getBBox = jest.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }));
};
