import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import {
  CANCELLABLE_PLR_STATUSES,
  isCancellableStatus,
  PIPELINE_RUN_STATUS_REGISTRY,
} from '../plr-status-config';

describe('CANCELLABLE_PLR_STATUSES', () => {
  it('should include Queued, Pending, and Running', () => {
    const cancellable = PIPELINE_RUN_STATUS_REGISTRY.getStatusesByTag('cancellable');
    expect(cancellable).toEqual(CANCELLABLE_PLR_STATUSES);
    expect(cancellable).toHaveLength(3);
  });

  it('should match getStatusesByTag cancellable from registry', () => {
    expect(CANCELLABLE_PLR_STATUSES).toEqual(
      PIPELINE_RUN_STATUS_REGISTRY.getStatusesByTag('cancellable'),
    );
  });
});

describe('isCancellableStatus', () => {
  it('should return true for a Running PipelineRun', () => {
    expect(isCancellableStatus(testPipelineRuns[DataState.RUNNING])).toBe(true);
  });

  it('should return true for a Pending PipelineRun', () => {
    expect(isCancellableStatus(testPipelineRuns[DataState.PIPELINE_RUN_PENDING])).toBe(true);
  });

  it('should return true for a Queued PipelineRun', () => {
    expect(isCancellableStatus(testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_PAC])).toBe(true);
  });

  it('should return false for a Succeeded PipelineRun', () => {
    expect(isCancellableStatus(testPipelineRuns[DataState.SUCCEEDED])).toBe(false);
  });

  it('should return false for a Failed PipelineRun', () => {
    expect(isCancellableStatus(testPipelineRuns[DataState.FAILED])).toBe(false);
  });

  it('should return false for a Cancelled PipelineRun', () => {
    expect(isCancellableStatus(testPipelineRuns[DataState.PIPELINE_RUN_CANCELLED])).toBe(false);
  });

  it('should return false for null', () => {
    expect(isCancellableStatus(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isCancellableStatus(undefined)).toBe(false);
  });
});
