import React from 'react';
import yaml from 'js-yaml';
import { useK8sWatchResource } from '../k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '../models';
import { ConfigMap } from '../types/configmap';

// Types would also be used in __data__/pipeline-config-data.ts
export type BuildPipelineConfigConfigMap = ConfigMap & {
  data: { 'config.yaml': string };
};

export type PipelineItem = {
  name: string;
  description?: string;
  detail?: string;
  bundle: string;
  'additional-params'?: string[];
};

export type BuildPipelineConfigJson = {
  'default-pipeline-name': string;
  pipelines: PipelineItem[];
};

export type PipelineTemplateJson = {
  defaultPipelineName: string;
  pipelines: PipelineItem[];
};

export const PIPELINE_DATA = {
  'default-pipeline-name': 'docker-build-oci-ta',
  pipelines: [
    {
      name: 'fbc-builder',
      bundle:
        'quay.io/konflux-ci/tekton-catalog/pipeline-fbc-builder@sha256:33f0a94171afa6ceadfe62a9b0e09bf1b3fe84c20b9fec8d7a28ecd1e771f4c6',
    },
    {
      name: 'docker-build',
      bundle:
        'quay.io/konflux-ci/tekton-catalog/pipeline-docker-build@sha256:effd08d960f33d9957618982244e0d9c06f89eaaca5d125a434eacfc9851a04f',
    },
    {
      name: 'docker-build-oci-ta',
      bundle:
        'quay.io/konflux-ci/tekton-catalog/pipeline-docker-build-oci-ta@sha256:9002db310cd002ddc7ccf94e08f8cd9b02c1bdd5dce36b59173fbc6cd4799f97',
    },
    {
      name: 'docker-build-multi-platform-oci-ta',
      bundle:
        'quay.io/konflux-ci/tekton-catalog/pipeline-docker-build-multi-platform-oci-ta@sha256:269480b2037478c1c8509c5f562b65f0b7f4e8675d5fda68b6bf3d28357962d7',
    },
  ],
};

export const useBuildPipelineConfig = (): [PipelineTemplateJson, boolean, unknown] => {
  const {
    data: buildPipelineConfig,
    isLoading,
    error,
  } = useK8sWatchResource<BuildPipelineConfigConfigMap>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      namespace: 'build-service',
      name: 'build-pipeline-config',
    },
    ConfigMapModel,
  );

  // Memoize the result of pipelineJson for performance
  const pipelineTemplateJson: PipelineTemplateJson = React.useMemo(() => {
    // we need to wait for its load
    if (isLoading) {
      return undefined;
    }

    // Get original pipeline config json from configmap.
    const buildPipelineConfigJson: BuildPipelineConfigJson =
      !isLoading && !error && buildPipelineConfig?.data
        ? yaml.load(buildPipelineConfig.data['config.yaml'])
        : undefined;

    // When there is no valid dynamic pipeline config, we enjoy hardcode data.
    const pipelineConfigJson: BuildPipelineConfigJson = buildPipelineConfigJson
      ? buildPipelineConfigJson
      : PIPELINE_DATA;

    // Format the pipelineTemplateJson.
    const json: PipelineTemplateJson = {
      defaultPipelineName: pipelineConfigJson['default-pipeline-name'],
      pipelines: pipelineConfigJson.pipelines,
    };
    return json;
  }, [buildPipelineConfig, isLoading, error]);

  return [pipelineTemplateJson, !isLoading, error];
};
