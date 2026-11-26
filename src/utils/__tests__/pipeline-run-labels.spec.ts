import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import {
  APPLICATION_PIPELINE_RUN_LABELS,
  getPipelineRunSelector,
  getPipelineRunLabel,
  NEW_COMPONENT_PIPELINE_RUN_LABELS,
} from '../pipeline-run-labels';

const pipelineRun = (labels = {}, annotations = {}) =>
  ({ metadata: { labels, annotations } }) as PipelineRunKind;

describe('pipeline-run-labels', () => {
  it('returns application-model labels', () => {
    expect(APPLICATION_PIPELINE_RUN_LABELS).toEqual({
      component: PipelineRunLabel.COMPONENT,
      componentVersion: PipelineRunLabel.COMPONENT_VERSION,
      pipelineType: PipelineRunLabel.PIPELINE_TYPE,
      versionSelector: PipelineRunLabel.COMPONENT_VERSION,
      versionAnnotations: [],
    });
  });

  it('returns new-component-model labels', () => {
    expect(NEW_COMPONENT_PIPELINE_RUN_LABELS).toEqual({
      component: PipelineRunLabel.V2_COMPONENT,
      componentVersion: PipelineRunLabel.V2_COMPONENT_VERSION,
      pipelineType: PipelineRunLabel.V2_PIPELINE_TYPE,
      versionSelector: undefined,
      versionAnnotations: [PipelineRunLabel.V2_COMPONENT_VERSION],
    });
  });

  it('builds selectors from the selected label profile', () => {
    expect(getPipelineRunSelector('component', NEW_COMPONENT_PIPELINE_RUN_LABELS, 'main')).toEqual({
      [PipelineRunLabel.V2_PIPELINE_TYPE]: PipelineRunType.BUILD,
      [PipelineRunLabel.V2_COMPONENT]: 'component',
    });
    expect(getPipelineRunSelector('component', APPLICATION_PIPELINE_RUN_LABELS, 'main')).toEqual({
      [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
      [PipelineRunLabel.COMPONENT]: 'component',
      [PipelineRunLabel.COMPONENT_VERSION]: 'main',
    });
  });

  it('reads V2 versions from labels and annotations', () => {
    expect(
      getPipelineRunLabel(
        pipelineRun({ [PipelineRunLabel.V2_COMPONENT_VERSION]: 'main' }),
        'componentVersion',
        NEW_COMPONENT_PIPELINE_RUN_LABELS,
      ),
    ).toBe('main');
    expect(
      getPipelineRunLabel(
        pipelineRun({}, { [PipelineRunLabel.V2_COMPONENT_VERSION]: 'release' }),
        'componentVersion',
        NEW_COMPONENT_PIPELINE_RUN_LABELS,
      ),
    ).toBe('release');
  });
});
