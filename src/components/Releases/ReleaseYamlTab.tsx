import * as React from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Bullseye, Flex, Spinner, Title } from '@patternfly/react-core';
import YAML from 'yaml';
import { useRelease } from '../../hooks/useReleases';
import { RouterParams } from '../../routes/utils';
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
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg" size="lg">
        View Release .yaml file
      </Title>
      <Flex className="pf-v5-u-py-lg">
        <Editor
          value={YAML.stringify(release ?? {})}
          defaultLanguage="yaml"
          height="500px"
          theme="vs-dark"
          options={{ readOnly: true }}
        />
      </Flex>
    </>
  );
};

export default ReleaseYamlTab;
