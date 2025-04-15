import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Flex, Spinner } from '@patternfly/react-core';
import { useRelease } from '../../hooks/useReleases';
import { RouterParams } from '../../routes/utils';
import { YAMLCodeEditor } from '../../shared/components/code-editor/YAMLCodeEditor';
import { useNamespace } from '../../shared/providers/Namespace';

const ReleaseYamlTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, finishedLoading] = useRelease(namespace, releaseName);

  if (!finishedLoading) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <Flex className="pf-v5-u-py-lg">
      <YAMLCodeEditor code={release} data-test="monaco-editor" />
    </Flex>
  );
};

export default ReleaseYamlTab;
