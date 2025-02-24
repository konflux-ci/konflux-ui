import {
  BuildPipelineConfigConfigMap,
  BuildPipelineConfigJson,
  PIPELINE_DATA,
} from '../hooks/useBuildPipelineConfig';

export const mockBuildPipelineConfig: BuildPipelineConfigConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'build-pipeline-config',
    namespace: 'build-service',
  },
  data: {
    'config.yaml':
      'default-pipeline-name: docker-build-oci-ta\npipelines:\n- name: fbc-builder\n  description: "fbc-builder example description"\n  bundle: quay.io/konflux-ci/examples/pipeline-fbc-builder@sha256:33f\n  additional-params:\n  - build-platforms\n- name: docker-build\n  bundle: quay.io/konflux-ci/examples/pipeline-docker-build@sha256:eff\n- name: docker-build-oci-ta\n  bundle: quay.io/konflux-ci/examples/pipeline-docker-build-oci-ta:005\n- name: docker-build-multi-platform-oci-ta\n  bundle: quay.io/konflux-ci/examples/pipeline-docker-build-multi-platform-oci-ta:005\n  additional-params:\n  - build-platforms\n- name: maven-zip-build\n  bundle: quay.io/konflux-ci/examples/pipeline-maven-zip-build:005\n- name: maven-zip-build-oci-ta\n  bundle: quay.io/konflux-ci/examples/pipeline-maven-zip-build-oci-ta:@sha256:900\n',
  },
};

export const invalidBuildPipelineConfig = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'build-pipeline-config',
    namespace: 'build-service',
  },
};

export const mockBuildPipelineConfigJson: BuildPipelineConfigJson = {
  'default-pipeline-name': 'docker-build-oci-ta',
  pipelines: [
    {
      name: 'fbc-builder',
      description: 'fbc-builder example description',
      bundle: 'quay.io/konflux-ci/examples/pipeline-fbc-builder@sha256:33f',
      'additional-params': ['build-platforms'],
    },
    {
      name: 'docker-build',
      bundle: 'quay.io/konflux-ci/examples/pipeline-docker-build@sha256:eff',
    },
    {
      name: 'docker-build-oci-ta',
      bundle: 'quay.io/konflux-ci/examples/pipeline-docker-build-oci-ta:005',
    },
    {
      name: 'docker-build-multi-platform-oci-ta',
      bundle: 'quay.io/konflux-ci/examples/pipeline-docker-build-multi-platform-oci-ta:005',
      'additional-params': ['build-platforms'],
    },
    {
      name: 'maven-zip-build',
      bundle: 'quay.io/konflux-ci/examples/pipeline-maven-zip-build:005',
    },
    {
      name: 'maven-zip-build-oci-ta',
      bundle: 'quay.io/konflux-ci/examples/pipeline-maven-zip-build-oci-ta:@sha256:900',
    },
  ],
};

export const mockDynamicPinelineTemplateJson = {
  defaultPipelineName: mockBuildPipelineConfigJson['default-pipeline-name'],
  pipelines: mockBuildPipelineConfigJson.pipelines,
};

export const mockConstPipelineTemplateJson = {
  defaultPipelineName: PIPELINE_DATA?.['default-pipeline-name'],
  pipelines: PIPELINE_DATA?.pipelines,
};
