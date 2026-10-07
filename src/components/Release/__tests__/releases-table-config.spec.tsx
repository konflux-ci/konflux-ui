import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReleaseKind } from '~/types';
import { routerRenderer } from '~/unit-test-utils';
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

  it.each([
    ['name', 'release-one', '/ns/test-ns/applications/app/releases/release-one', undefined],
    ['component', 'component-a', '/ns/test-ns/components/component-a', undefined],
    ['releaseSnapshot', 'snapshot-a', '/ns/test-ns/applications/app/snapshots/snapshot-a', true],
    [
      'tenantCollectorPipelineRun',
      'collector-pr',
      '/ns/tenant-ns/applications/app/pipelineruns/collector-pr',
      undefined,
    ],
    [
      'tenantPipelineRun',
      'tenant-pr',
      '/ns/tenant-ns/applications/app/pipelineruns/tenant-pr',
      undefined,
    ],
    [
      'managedPipelineRun',
      'managed-pr',
      '/ns/managed-ns/applications/app/pipelineruns/managed-pr',
      true,
    ],
    ['finalPipelineRun', 'final-pr', '/ns/final-ns/applications/app/pipelineruns/final-pr', true],
  ])(
    'renders %s link destination, text and navigation state',
    async (id, text, href, withBackButton) => {
      const user = userEvent.setup();
      const release = {
        ...baseRelease,
        metadata: {
          ...baseRelease.metadata,
          labels: { ...baseRelease.metadata.labels, 'appstudio.openshift.io/application': 'app' },
        },
      };
      const column = getColumn(id);
      const cell = column.cell({
        row: { original: release },
        getValue: () => column.accessorFn?.(release),
        table: { options: { meta: { currentNamespace: 'release-ns', applicationName: 'app' } } },
      } as never);
      routerRenderer(<>{cell}</>);
      const link = screen.getByRole('link', { name: text });
      expect(link).toHaveAttribute('href', href);
      await user.click(link);
      expect(window.history.state.usr).toEqual(
        withBackButton
          ? {
              backButtonLink: '/ns/release-ns/applications/app/releases',
              backButtonText: 'Back to release list',
            }
          : null,
      );
    },
  );

  it('renders release name as a link when the application comes from table metadata', () => {
    const releaseWithoutApplicationLabel = {
      ...baseRelease,
      metadata: { ...baseRelease.metadata, labels: {} },
    } as ReleaseKind;
    const nameCell = getColumn('name')?.cell?.({
      row: { original: releaseWithoutApplicationLabel },
      table: { options: { meta: { applicationName: 'app' } } },
    } as never);
    routerRenderer(<>{nameCell}</>);
    expect(screen.getByRole('link', { name: 'release-one' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/app/releases/release-one',
    );
  });

  it('routes group snapshot links to group details with group back navigation', async () => {
    const user = userEvent.setup();
    const cell = getColumn('releaseSnapshot')?.cell?.({
      row: { original: baseRelease },
      getValue: () => 'snapshot-a',
      table: {
        options: {
          meta: { currentNamespace: 'test-ns', groupName: 'my-group' },
        },
      },
    } as never);
    routerRenderer(<>{cell}</>);
    const link = screen.getByRole('link', { name: 'snapshot-a' });
    expect(link).toHaveAttribute('href', '/ns/test-ns/groups/my-group/snapshots/snapshot-a');
    await user.click(link);
    expect(window.history.state.usr).toEqual({
      backButtonLink: '/ns/test-ns/groups/my-group/releases',
      backButtonText: 'Back to releases',
    });
  });

  it('omits snapshot back-button state within the current namespace', async () => {
    const user = userEvent.setup();
    const cell = getColumn('releaseSnapshot')?.cell?.({
      row: { original: baseRelease },
      getValue: () => 'snapshot-a',
      table: { options: { meta: { currentNamespace: 'test-ns', applicationName: 'app' } } },
    } as never);
    routerRenderer(<>{cell}</>);
    await user.click(screen.getByRole('link', { name: 'snapshot-a' }));
    expect(window.history.state.usr).toBeNull();
  });

  it('should render a pipeline run name as text when application metadata is missing', () => {
    const releaseWithoutApplication = {
      ...baseRelease,
      metadata: {
        ...baseRelease.metadata,
        labels: {},
      },
    } as ReleaseKind;
    const pipelineCell = getColumn('tenantPipelineRun')?.cell?.({
      row: { original: releaseWithoutApplication },
      table: { options: { meta: {} } },
    } as never);
    expect(pipelineCell).toBe('tenant-pr');
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
