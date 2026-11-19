import { runStatus } from '~/consts/pipelinerun';
import {
  CANCELLABLE_PLR_STATUSES,
  isCancellableStatus,
  PIPELINE_RUN_STATUS_REGISTRY,
} from '../plr-status-config';

describe('CANCELLABLE_PLR_STATUSES', () => {
  it('should include Queued, Pending, and Running', () => {
    expect(CANCELLABLE_PLR_STATUSES).toContain(runStatus.Queued);
    expect(CANCELLABLE_PLR_STATUSES).toContain(runStatus.Pending);
    expect(CANCELLABLE_PLR_STATUSES).toContain(runStatus.Running);
  });

  it('should not include terminal or non-cancellable statuses', () => {
    expect(CANCELLABLE_PLR_STATUSES).not.toContain(runStatus.Succeeded);
    expect(CANCELLABLE_PLR_STATUSES).not.toContain(runStatus.Failed);
    expect(CANCELLABLE_PLR_STATUSES).not.toContain(runStatus.Cancelled);
    expect(CANCELLABLE_PLR_STATUSES).not.toContain(runStatus.Unknown);
  });

  it('should match getStatusesByTag cancellable from registry', () => {
    expect(CANCELLABLE_PLR_STATUSES).toEqual(
      PIPELINE_RUN_STATUS_REGISTRY.getStatusesByTag('cancellable'),
    );
  });
});

describe('isCancellableStatus', () => {
  it('should return true for Running status', () => {
    expect(isCancellableStatus(runStatus.Running)).toBe(true);
  });

  it('should return true for Pending status', () => {
    expect(isCancellableStatus(runStatus.Pending)).toBe(true);
  });

  it('should return true for Queued status', () => {
    expect(isCancellableStatus(runStatus.Queued)).toBe(true);
  });

  it('should return false for Succeeded status', () => {
    expect(isCancellableStatus(runStatus.Succeeded)).toBe(false);
  });

  it('should return false for Failed status', () => {
    expect(isCancellableStatus(runStatus.Failed)).toBe(false);
  });

  it('should return false for Cancelled status', () => {
    expect(isCancellableStatus(runStatus.Cancelled)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isCancellableStatus(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isCancellableStatus(undefined)).toBe(false);
  });
});
