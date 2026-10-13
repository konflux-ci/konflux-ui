import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { TektonResourceLabel } from '~/types/coreTekton';
import { buildConformaSecurityTaskRunSelector } from '../conforma-taskrun-query';

describe('buildConformaSecurityTaskRunSelector', () => {
  it('omits the application label when applicationName is undefined', () => {
    const selector = buildConformaSecurityTaskRunSelector(undefined);

    expect(selector.matchLabels).not.toHaveProperty(PipelineRunLabel.APPLICATION);
    expect(selector.matchLabels).toEqual({
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
    });
    expect(selector.matchExpressions).toEqual([
      {
        key: TektonResourceLabel.pipelineTask,
        operator: 'In',
        values: [EC_TASK, CONFORMA_TASK],
      },
    ]);
  });

  it('includes the application label when applicationName is provided', () => {
    const selector = buildConformaSecurityTaskRunSelector('test-app');

    expect(selector.matchLabels).toEqual(
      expect.objectContaining({
        [PipelineRunLabel.APPLICATION]: 'test-app',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
      }),
    );
  });
});
