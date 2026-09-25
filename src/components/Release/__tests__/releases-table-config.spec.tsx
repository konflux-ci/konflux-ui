import { ReleaseKind } from '~/types';
import { RELEASES_LIST_COLUMNS, RELEASES_LIST_COLUMN_STATE_KEY } from '../releases-table-config';

const getColumn = (id: string) => RELEASES_LIST_COLUMNS.find((c) => c.id === id);

const baseRelease = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'release-one',
    namespace: 'test-ns',
    uid: 'uid-1',
    creationTimestamp: '2024-01-01T00:00:00Z',
    labels: {
      'appstudio.openshift.io/component': 'component-a',
    },
  },
  spec: {
    releasePlan: 'plan-a',
    snapshot: 'snapshot-a',
  },
  status: {
    startTime: '2024-01-01T00:00:00Z',
    completionTime: '2024-01-01T00:10:00Z',
    collectorsProcessing: {
      tenantCollectorsProcessing: { pipelineRun: 'tenant-ns/collector-pr' },
    },
    tenantProcessing: { pipelineRun: 'tenant-ns/tenant-pr' },
    managedProcessing: { pipelineRun: 'managed-ns/managed-pr' },
    finalProcessing: { pipelineRun: 'final-ns/final-pr' },
  },
} as unknown as ReleaseKind;

describe('releases-table-config', () => {
  it('should expose a stable column state key', () => {
    expect(RELEASES_LIST_COLUMN_STATE_KEY).toBe('releases-list');
  });

  it('should define all expected columns with name as non-hidable', () => {
    const ids = RELEASES_LIST_COLUMNS.map((c) => c.id);
    expect(ids).toEqual([
      'name',
      'created',
      'duration',
      'status',
      'component',
      'releasePlan',
      'releaseSnapshot',
      'tenantCollectorPipelineRun',
      'tenantPipelineRun',
      'managedPipelineRun',
      'finalPipelineRun',
    ]);
    expect(getColumn('name')?.nonHidable).toBe(true);
  });

  it('should resolve name, created, release plan and snapshot accessors', () => {
    expect(getColumn('name')?.accessorFn?.(baseRelease)).toBe('release-one');
    expect(getColumn('created')?.accessorFn?.(baseRelease)).toBe('2024-01-01T00:00:00Z');
    expect(getColumn('releasePlan')?.accessorFn?.(baseRelease)).toBe('plan-a');
    expect(getColumn('releaseSnapshot')?.accessorFn?.(baseRelease)).toBe('snapshot-a');
  });

  it('should resolve duration accessor and fall back to - without start time', () => {
    expect(getColumn('duration')?.accessorFn?.(baseRelease)).toBe('10 minutes');
    expect(getColumn('duration')?.accessorFn?.({ ...baseRelease, status: {} } as ReleaseKind)).toBe(
      '-',
    );
  });

  it('should resolve component accessor and fall back to - is covered by cell', () => {
    expect(getColumn('component')?.accessorFn?.(baseRelease)).toBe('component-a');
    expect(
      getColumn('component')?.accessorFn?.({
        ...baseRelease,
        metadata: { ...baseRelease.metadata, labels: {} },
      } as ReleaseKind),
    ).toBeUndefined();
  });

  it('should resolve pipeline run accessors to the run name only', () => {
    expect(getColumn('tenantCollectorPipelineRun')?.accessorFn?.(baseRelease)).toBe('collector-pr');
    expect(getColumn('tenantPipelineRun')?.accessorFn?.(baseRelease)).toBe('tenant-pr');
    expect(getColumn('managedPipelineRun')?.accessorFn?.(baseRelease)).toBe('managed-pr');
    expect(getColumn('finalPipelineRun')?.accessorFn?.(baseRelease)).toBe('final-pr');
  });

  it("should return '-' for missing pipeline runs", () => {
    const releaseWithoutRuns = {
      ...baseRelease,
      status: { startTime: '2024-01-01T00:00:00Z' },
    } as unknown as ReleaseKind;
    expect(getColumn('tenantCollectorPipelineRun')?.accessorFn?.(releaseWithoutRuns)).toBe('-');
    expect(getColumn('tenantPipelineRun')?.accessorFn?.(releaseWithoutRuns)).toBe('-');
    expect(getColumn('managedPipelineRun')?.accessorFn?.(releaseWithoutRuns)).toBe('-');
    expect(getColumn('finalPipelineRun')?.accessorFn?.(releaseWithoutRuns)).toBe('-');
  });
});
