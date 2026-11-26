import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';

export type PipelineRunLabelConfig = {
  component: PipelineRunLabel;
  componentVersion: PipelineRunLabel;
  pipelineType: PipelineRunLabel;
  versionSelector?: PipelineRunLabel;
  versionAnnotations: PipelineRunLabel[];
};

export const APPLICATION_PIPELINE_RUN_LABELS: PipelineRunLabelConfig = {
  component: PipelineRunLabel.COMPONENT,
  componentVersion: PipelineRunLabel.COMPONENT_VERSION,
  pipelineType: PipelineRunLabel.PIPELINE_TYPE,
  versionSelector: PipelineRunLabel.COMPONENT_VERSION,
  versionAnnotations: [],
};

export const NEW_COMPONENT_PIPELINE_RUN_LABELS: PipelineRunLabelConfig = {
  component: PipelineRunLabel.V2_COMPONENT,
  componentVersion: PipelineRunLabel.V2_COMPONENT_VERSION,
  pipelineType: PipelineRunLabel.V2_PIPELINE_TYPE,
  versionAnnotations: [PipelineRunLabel.V2_COMPONENT_VERSION],
};

export const getPipelineRunSelector = (
  componentName: string,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
  version?: string,
) => {
  return {
    [labels.pipelineType]: PipelineRunType.BUILD,
    [labels.component]: componentName,
    ...(version && labels.versionSelector && { [labels.versionSelector]: version }),
  };
};

export const getPipelineRunComponentSelector = (
  componentName: string,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
) => ({
  [labels.component]: componentName,
});

export const getPipelineRunLabel = (
  pipelineRun: PipelineRunKind,
  key: keyof Pick<PipelineRunLabelConfig, 'component' | 'componentVersion' | 'pipelineType'>,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
) => {
  const labelValue = pipelineRun.metadata?.labels?.[labels[key]];
  if (labelValue || key !== 'componentVersion') {
    return labelValue;
  }

  return labels.versionAnnotations
    .map((annotation) => pipelineRun.metadata?.annotations?.[annotation])
    .find(Boolean);
};

export const matchesPipelineRunVersion = (
  pipelineRun: PipelineRunKind,
  version: string | undefined,
  labels: PipelineRunLabelConfig = APPLICATION_PIPELINE_RUN_LABELS,
) => {
  return (
    !version ||
    labels.versionSelector !== undefined ||
    getPipelineRunLabel(pipelineRun, 'componentVersion', labels) === version
  );
};
