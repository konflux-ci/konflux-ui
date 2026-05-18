import { PIPELINE_RUN_COLUMNS_DEFINITIONS, PipelineRunColumnKeys } from '~/consts/pipeline';
import { getPipelineRunListHeader } from '../PipelineRunListHeader';

describe('getPipelineRunListHeader', () => {
  it('does not define a Reference column in column management definitions', () => {
    const columnKeys = PIPELINE_RUN_COLUMNS_DEFINITIONS.map((column) => column.key);
    expect(columnKeys).not.toContain('reference');
  });

  it('includes Trigger when trigger is in visibleColumns', () => {
    const visibleColumns = new Set<PipelineRunColumnKeys>(['name', 'trigger']);
    const headers = getPipelineRunListHeader(visibleColumns)();
    const titles = headers.map((column) => column.title);

    expect(titles).toContain('Trigger');
    expect(titles).not.toContain('Reference');
  });

  it('does not include Trigger when trigger is not in visibleColumns', () => {
    const visibleColumns = new Set<PipelineRunColumnKeys>(['name']);
    const headers = getPipelineRunListHeader(visibleColumns)();
    const titles = headers.map((column) => column.title);

    expect(titles).not.toContain('Trigger');
    expect(titles).not.toContain('Reference');
  });
});
