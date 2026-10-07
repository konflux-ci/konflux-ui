import {
  plrNameSearchConfig,
  plrStatusFilterConfig,
  plrTypeFilterConfig,
  plrEventTypeFilterConfig,
} from '~/components/PipelineRunsPage/pipelineRunFilterConfigs';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { PLRStatus } from '~/utils/plr-status-config';

const run: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: {
    name: 'component-build',
    labels: { [PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL]: '123' },
  },
  spec: {},
};

describe('pipeline run filter configurations', () => {
  it('matches names case-insensitively without changing whitespace semantics', () => {
    const field = plrNameSearchConfig.fields.find(({ value }) => value === 'name');
    expect(field.filterFn(run, 'BUILD')).toBe(true);
    expect(field.filterFn(run, 'other')).toBe(false);
    expect(field.filterFn(run, ' build ')).toBe(false);
  });

  it('matches exact PR numbers', () => {
    const field = plrNameSearchConfig.fields.find(({ value }) => value === 'prNumber');
    expect(field.filterFn(run, '123')).toBe(true);
    expect(field.filterFn(run, '12')).toBe(false);
  });

  it('uses the shared status registry for client-side filtering', () => {
    expect(plrStatusFilterConfig.filterFn).toBe(PLRStatus.statusFilterFn);
    expect(plrStatusFilterConfig.mode).not.toBe('api');
  });

  it('keeps type and event type filters on the API', () => {
    expect(plrTypeFilterConfig).toMatchObject({ param: 'type', mode: 'api' });
    expect(plrEventTypeFilterConfig).toMatchObject({ param: 'eventType', mode: 'api' });
  });
});
